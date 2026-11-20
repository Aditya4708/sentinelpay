"""
SentinelPay - rule analysis and reliability-weighted combination.

Read-only: loads the saved Random Forest, measures every rule, and tests two ways of
combining the rules with the model. Everything that is learned (rule reliability, rule
weights, decision thresholds) is fitted on the TRAINING split only and evaluated on the
untouched test split. The model's scores on the training split come from 5-fold
cross-validation, so they are not inflated by the model having memorised those rows.

Run from /app with PYTHONPATH=/app/scripts
"""

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split

from feature_engineering import build_features

RANDOM_STATE = 42
MIN_RELIABLE_PRECISION = 0.50

# Rule name -> weight as seeded in the database (the score boost is weight x 10 points).
RULES = {
    "AMOUNT_THRESHOLD": 1.5,
    "TIME_WINDOW": 1.0,
    "NEW_DEVICE": 1.2,
    "VELOCITY_CHECK": 1.3,
    "SHARED_DEVICE": 1.8,
}


def rule_masks(frame, full_frame):
    """The same conditions as the backend rule engine (plus the cross-account device rule)."""
    users_per_device = full_frame.groupby("device_id")["sender_user_id"].nunique()
    shared = set(users_per_device[users_per_device > 1].index)
    return pd.DataFrame({
        "AMOUNT_THRESHOLD": frame["amount"] > 50000,
        "TIME_WINDOW": (frame["hour_of_day"] >= 0) & (frame["hour_of_day"] <= 5),
        "NEW_DEVICE": frame["is_new_device"] == 1,
        "VELOCITY_CHECK": frame["txn_velocity_1h"] >= 3,
        "SHARED_DEVICE": frame["device_id"].isin(shared),
    }).astype(int)


def fmt(value):
    return "   -  " if value is None or (isinstance(value, float) and np.isnan(value)) else "%6.3f" % value


def flag_metrics(y_true, flag):
    flag = np.asarray(flag).astype(int)
    fp = int(((flag == 1) & (np.asarray(y_true) == 0)).sum())
    return (
        precision_score(y_true, flag, zero_division=0),
        recall_score(y_true, flag, zero_division=0),
        f1_score(y_true, flag, zero_division=0),
        fp,
    )


def best_threshold(y_true, scores):
    best_t, best_f1 = 0.5, -1.0
    for t in np.linspace(0.05, 0.95, 91):
        f1 = f1_score(y_true, (scores >= t).astype(int), zero_division=0)
        if f1 > best_f1:
            best_t, best_f1 = float(t), f1
    return best_t


def stack_features(proba, masks):
    p = np.clip(proba, 1e-3, 1 - 1e-3)
    return np.column_stack([np.log(p / (1 - p)), masks[list(RULES)].values])


def main():
    print("Loading data and engineering features...")
    transactions = pd.read_csv("data/raw/synthetic_transactions.csv")
    users = pd.read_csv("data/raw/synthetic_users.csv")
    df, feature_cols = build_features(transactions, users)

    X = df[feature_cols].fillna(0)
    y = df["is_fraud"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )
    df_train, df_test = df.loc[X_train.index], df.loc[X_test.index]

    model = joblib.load("models/random_forest.joblib")
    if model.n_features_in_ != len(feature_cols):
        print("The saved model does not match the current feature list. Retrain first.")
        return

    masks_train, masks_test = rule_masks(df_train, df), rule_masks(df_test, df)
    ml_test = model.predict_proba(X_test)[:, 1]
    ml_flag = ml_test >= 0.5
    yt = y_test.values

    print("Scoring the training split by cross-validation (about a minute)...")
    cv_model = RandomForestClassifier(
        n_estimators=200, max_depth=12, class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1
    )
    ml_train = cross_val_predict(
        cv_model, X_train, y_train, method="predict_proba",
        cv=StratifiedKFold(5, shuffle=True, random_state=RANDOM_STATE),
    )[:, 1]

    # ---------------------------------------------------------------- 1. each rule
    print("\n" + "=" * 92)
    print("1. EACH RULE ON ITS OWN (test split: %d transactions, %d fraud)" % (len(yt), int(yt.sum())))
    print("=" * 92)
    print("%-18s %7s %9s %7s %12s %14s %14s" % ("rule", "weight", "fires", "prec.", "recall", "extra frauds", "extra false"))
    print("%-18s %7s %9s %7s %12s %14s %14s" % ("", "", "", "", "", "caught*", "alarms*"))
    reliable = []
    train_precision = {}
    for name in RULES:
        fired_train = masks_train[name].values == 1
        n_train = int(fired_train.sum())
        train_precision[name] = (y_train.values[fired_train].sum() / n_train) if n_train else float("nan")
        if n_train and train_precision[name] >= MIN_RELIABLE_PRECISION:
            reliable.append(name)

        fired = masks_test[name].values == 1
        n = int(fired.sum())
        tp = int((fired & (yt == 1)).sum())
        prec = tp / n if n else float("nan")
        rec = tp / int(yt.sum())
        extra_caught = int((fired & (yt == 1) & ~ml_flag).sum())
        extra_false = int((fired & (yt == 0) & ~ml_flag).sum())
        print("%-18s %7.1f %9d %s %s %14d %14d" % (name, RULES[name], n, fmt(prec), fmt(rec), extra_caught, extra_false))
    print("* compared with what the model already flags on its own at 0.5")

    print("\nReliability measured on the TRAINING split (a rule may flag on its own at >= %.2f):" % MIN_RELIABLE_PRECISION)
    for name in RULES:
        status = "reliable" if name in reliable else "advisory only"
        print("  %-18s precision %s   -> %s" % (name, fmt(train_precision[name]), status))

    # ---------------------------------------------------------------- 2. combinations
    print("\n" + "=" * 92)
    print("2. COMBINING RULES WITH THE MODEL (test split)")
    print("=" * 92)

    weights = np.array([RULES[r] for r in RULES])
    boost = masks_test[list(RULES)].values @ weights * 10
    deployed_score = np.minimum(100, ml_test * 100 + boost)

    any_rule = masks_test[list(RULES)].values.max(axis=1) == 1
    reliable_rule = (masks_test[reliable].values.max(axis=1) == 1) if reliable else np.zeros(len(yt), dtype=bool)

    stacker = LogisticRegression(max_iter=1000)
    stacker.fit(stack_features(ml_train, masks_train), y_train)
    stack_train = stacker.predict_proba(stack_features(ml_train, masks_train))[:, 1]
    stack_test = stacker.predict_proba(stack_features(ml_test, masks_test))[:, 1]
    t_stack = best_threshold(y_train, stack_train)
    t_ml = best_threshold(y_train, ml_train)

    rows = [
        ("Model alone, threshold 0.50 (deployed)", ml_flag, average_precision_score(yt, ml_test)),
        ("Model alone, threshold %.2f (tuned)" % t_ml, ml_test >= t_ml, average_precision_score(yt, ml_test)),
        ("Model OR every rule (deployed hybrid)", ml_flag | any_rule, average_precision_score(yt, deployed_score)),
        ("Model OR reliable rules only (gated)", ml_flag | reliable_rule, None),
        ("Learned weights, threshold %.2f (stacked)" % t_stack, stack_test >= t_stack, average_precision_score(yt, stack_test)),
    ]
    print("%-44s %7s %7s %7s %7s %8s" % ("", "prec.", "recall", "F1", "false+", "PR-AUC"))
    results = []
    for label, flag, ap in rows:
        p, r, f1, fp = flag_metrics(yt, flag)
        results.append((label, f1, ap))
        print("%-44s %s %s %s %7d %s" % (label, fmt(p), fmt(r), fmt(f1), fp, fmt(ap)))
    print("PR-AUC is shown only where the method produces a continuous score.")

    print("\nWhat the stacker learned (log-odds per unit; the model's own score enters as 'model'):")
    names = ["model"] + list(RULES)
    for name, coef in zip(names, stacker.coef_[0]):
        print("  %-18s %+7.3f" % (name, coef))

    best = max(results, key=lambda item: item[1])
    print("\nBest F1 on the test split: %s (%.4f)" % (best[0], best[1]))
    print("Differences of about 0.01 or less are within what a different random split would change.")


if __name__ == "__main__":
    main()