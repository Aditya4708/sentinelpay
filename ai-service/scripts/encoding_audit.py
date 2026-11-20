"""
SentinelPay - encoding audit.

Answers two questions about the current model and dataset:

1. Skew: how much do the hand-written encodings in app/models/predictor.py change the
   model's predictions compared with the encoding it was trained on?
2. Signal: do the four categorical features carry any information about fraud? The same
   Random Forest is retrained without them and compared on the same split.

Run from /app with PYTHONPATH=/app/scripts:/app
"""

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import average_precision_score, f1_score
from sklearn.model_selection import train_test_split

from feature_engineering import build_features
from app.models.predictor import APP_CODES, BANK_CODES, MERCHANT_CODES, TYPE_CODES

RANDOM_STATE = 42
SEEDS = [42, 7, 99]
CATEGORICAL = ["type_code", "merchant_category_code", "upi_app_code", "bank_code"]

# Names the web app sends where they differ from the names used in the dataset.
UI_BANK = {
    "HDFC": "HDFC Bank", "SBI": "State Bank of India", "ICICI": "ICICI Bank", "Axis": "Axis Bank",
    "Bank of Baroda": "Bank of Baroda", "Kotak Mahindra": "Kotak Mahindra Bank",
    "Punjab National Bank": "Punjab National Bank",
}
UI_APP = {"GPay": "Google Pay"}


def serving_codes(frame, as_web_app):
    """The four codes exactly as predictor.py would produce them for these rows."""
    if as_web_app:
        # The simulator always sends type P2P and merchant category P2P, plus the full names.
        types = pd.Series("P2P", index=frame.index)
        merchants = pd.Series("P2P", index=frame.index)
        apps = frame["upi_app"].replace(UI_APP)
        banks = frame["bank"].replace(UI_BANK)
    else:
        types, merchants = frame["type"], frame["merchant_category"]
        apps, banks = frame["upi_app"], frame["bank"]
    out = pd.DataFrame(index=frame.index)
    out["type_code"] = types.map(TYPE_CODES).fillna(0)
    out["merchant_category_code"] = merchants.map(MERCHANT_CODES).fillna(0)
    out["upi_app_code"] = apps.map(APP_CODES).fillna(0)
    out["bank_code"] = banks.map(BANK_CODES).fillna(0)
    return out


def score(y_true, proba):
    predicted = (proba >= 0.5).astype(int)
    return f1_score(y_true, predicted, zero_division=0), average_precision_score(y_true, proba)


def fit_and_score(columns, X_train, y_train, X_test, y_test, seed):
    model = RandomForestClassifier(
        n_estimators=200, max_depth=12, class_weight="balanced", random_state=seed, n_jobs=-1
    )
    model.fit(X_train[columns], y_train)
    return score(y_test, model.predict_proba(X_test[columns])[:, 1])


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
    df_test = df.loc[X_test.index]
    present = [c for c in CATEGORICAL if c in feature_cols]

    model = joblib.load("models/random_forest.joblib")
    saved_cols = json.load(open("models/feature_columns.json"))
    if saved_cols != feature_cols or model.n_features_in_ != len(feature_cols):
        print("\nThe saved model does not match the current feature list. Retrain before auditing.")
        return

    print("\n" + "=" * 78)
    print("1. SKEW: the saved model, scored on %d test transactions" % len(y_test))
    print("=" * 78)
    if not present:
        print("The model no longer uses categorical features, so encoding skew cannot occur.")
    else:
        p_train = model.predict_proba(X_test)[:, 1]
        f1_t, ap_t = score(y_test, p_train)
        print("%-34s F1 %.4f   PR-AUC %.4f" % ("Encoded as it was trained", f1_t, ap_t))
        for label, as_web in [("Live encoding, dataset names", False), ("Live encoding, as the web app sends", True)]:
            X_live = X_test.copy()
            codes = serving_codes(df_test, as_web)
            for column in present:
                X_live[column] = codes[column].values
            p_live = model.predict_proba(X_live)[:, 1]
            f1_l, ap_l = score(y_test, p_live)
            shift = np.abs(p_train - p_live) * 100
            flips = int(((p_train >= 0.5) != (p_live >= 0.5)).sum())
            print("%-34s F1 %.4f   PR-AUC %.4f" % (label, f1_l, ap_l))
            print("%-34s risk score moves by %.2f points on average (max %.1f); %d verdicts flip" % ("", shift.mean(), shift.max(), flips))

    print("\n" + "=" * 78)
    print("2. SIGNAL: how much does scrambling each feature hurt the model? (drop in PR-AUC)")
    print("=" * 78)
    result = permutation_importance(
        model, X_test, y_test, scoring="average_precision", n_repeats=5, random_state=RANDOM_STATE, n_jobs=-1
    )
    ranked = sorted(zip(feature_cols, result.importances_mean), key=lambda item: -item[1])
    for name, value in ranked:
        marker = "   <- categorical" if name in CATEGORICAL else ""
        print("%-26s %7.4f%s" % (name, value, marker))

    print("\n" + "=" * 78)
    print("3. Retraining the same Random Forest, with and without the four categorical features")
    print("=" * 78)
    without = [c for c in feature_cols if c not in CATEGORICAL]
    rows = {"all %d features" % len(feature_cols): feature_cols, "without the four categorical": without}
    print("%-32s %-22s %-22s" % ("", "F1 mean (min-max)", "PR-AUC mean (min-max)"))
    for label, columns in rows.items():
        results = [fit_and_score(columns, X_train, y_train, X_test, y_test, seed) for seed in SEEDS]
        f1s = [r[0] for r in results]
        aps = [r[1] for r in results]
        print("%-32s %.4f (%.4f-%.4f)   %.4f (%.4f-%.4f)" % (label, np.mean(f1s), min(f1s), max(f1s), np.mean(aps), min(aps), max(aps)))
    print("\n(%d random seeds each. Differences smaller than the min-max spread are noise.)" % len(SEEDS))


if __name__ == "__main__":
    main()