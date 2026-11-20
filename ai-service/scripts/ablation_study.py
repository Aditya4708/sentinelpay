"""
SentinelPay - Ablation Study (Rules-only vs ML-only vs Hybrid)

Empirically tests the core claim of the project: that combining a trained
ML model with explicit domain rules outperforms either approach alone.
Uses the same train/test split as train_models.py for a fair comparison.
"""

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, average_precision_score, confusion_matrix

from feature_engineering import build_features

RANDOM_STATE = 42


def load_data():
    transactions = pd.read_csv("data/raw/synthetic_transactions.csv")
    users = pd.read_csv("data/raw/synthetic_users.csv")
    return transactions, users


def apply_rules(df, full_df):
    # Mirrors the Node.js rule engine logic (ruleEngine.js) in Python.
    amount_rule = df["amount"] > 50000
    time_rule = (df["hour_of_day"] >= 0) & (df["hour_of_day"] <= 5)
    device_rule = df["is_new_device"] == 1
    velocity_rule = df["txn_velocity_1h"] >= 3

    # Cross-account rule: a device used by more than one distinct user is a
    # mule-network signal that a per-transaction ML model cannot see, since
    # it only ever looks at one transaction (one row) in isolation.
    device_user_counts = full_df.groupby("device_id")["sender_user_id"].nunique()
    shared_devices = set(device_user_counts[device_user_counts > 1].index)
    shared_device_rule = df["device_id"].isin(shared_devices)

    rule_hits = (
        amount_rule.astype(int) * 1.5
        + time_rule.astype(int) * 1.0
        + device_rule.astype(int) * 1.2
        + velocity_rule.astype(int) * 1.3
        + shared_device_rule.astype(int) * 1.8
    )

    rules_only_pred = (amount_rule | time_rule | device_rule | velocity_rule | shared_device_rule).astype(int)
    rule_score_boost = rule_hits * 10

    return rules_only_pred, rule_score_boost, shared_device_rule


def evaluate(y_true, y_pred, label, y_score=None):
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0

    row = {
        "approach": label,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": round(false_positive_rate, 4),
        "false_positives": int(fp),
        "false_negatives": int(fn),
    }
    if y_score is not None:
        row["pr_auc"] = round(average_precision_score(y_true, y_score), 4)
    return row


def main():
    print("Loading data and engineering features...")
    transactions, users = load_data()
    df, feature_cols = build_features(transactions, users)

    X = df[feature_cols].fillna(0)
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test, df_train, df_test = train_test_split(
        X, y, df, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    print("Loading trained Random Forest model...")
    rf = joblib.load("models/random_forest.joblib")

    ml_proba = rf.predict_proba(X_test)[:, 1]
    ml_only_pred = (ml_proba >= 0.5).astype(int)

    rules_only_pred, rule_score_boost, shared_device_rule = apply_rules(df_test, df)

    hybrid_score = np.minimum(100, ml_proba * 100 + rule_score_boost.values)
    hybrid_pred = ((ml_proba >= 0.5) | (rules_only_pred == 1)).astype(int)

    print("")
    print(f"Shared-device (cross-account) rule fired on {shared_device_rule.sum()} of {len(df_test)} test transactions")
    print(f"Of those, {int((shared_device_rule & (y_test == 1)).sum())} were actual fraud "
          f"and {int((shared_device_rule & (ml_only_pred == 0) & (y_test == 1)).sum())} were fraud cases ML alone MISSED")

    results = [
        evaluate(y_test, rules_only_pred, "Rules-only (no ML)"),
        evaluate(y_test, ml_only_pred, "ML-only (no rules)", y_score=ml_proba),
        evaluate(y_test, hybrid_pred, "Hybrid (ML + Rules)", y_score=hybrid_score / 100),
    ]

    comparison_df = pd.DataFrame(results)

    print("")
    print("=" * 70)
    print("ABLATION STUDY: Rules-only vs ML-only vs Hybrid")
    print("=" * 70)
    for r in results:
        print(f"{r['approach']:22s} | Precision: {r['precision']:.4f} | Recall: {r['recall']:.4f} | "
              f"F1: {r['f1_score']:.4f} | FP Rate: {r['false_positive_rate']:.4f} | "
              f"False Positives: {r['false_positives']}")

    rules, ml, hybrid = results

    print("")
    print("-" * 70)
    print("WHAT THE NUMBERS SAY (computed from the table above, not fixed text):")
    print("- Hybrid vs ML-only:     precision %+.4f, recall %+.4f, F1 %+.4f, false positives %+d" % (
        hybrid["precision"] - ml["precision"], hybrid["recall"] - ml["recall"],
        hybrid["f1_score"] - ml["f1_score"], hybrid["false_positives"] - ml["false_positives"]))
    print("- Rules-only vs ML-only: precision %+.4f, recall %+.4f, F1 %+.4f, false positives %+d" % (
        rules["precision"] - ml["precision"], rules["recall"] - ml["recall"],
        rules["f1_score"] - ml["f1_score"], rules["false_positives"] - ml["false_positives"]))
    if hybrid["f1_score"] > ml["f1_score"]:
        print("- Combining rules with the model improved F1 over the model alone.")
    elif hybrid["recall"] <= ml["recall"] and hybrid["false_positives"] >= ml["false_positives"]:
        print("- The rules added no recall and no precision on top of the model.")
        print("  Combined by a plain OR, their value here is policy control and explanations, not accuracy.")
    else:
        print("- Combining rules with the model changed the trade-off between recall and false alarms.")
    print("-" * 70)

    comparison_df.to_csv("data/processed/ablation_comparison.csv", index=False)
    print("")
    print("Saved to data/processed/ablation_comparison.csv")


if __name__ == "__main__":
    main()