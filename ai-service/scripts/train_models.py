"""
RiskLens AI - Model Training & Comparison (Module 5)

Trains Logistic Regression, Random Forest, XGBoost, and Isolation Forest on
the synthetic dataset, evaluates each, and saves the best supervised model
plus the comparison table for the project report.
"""

import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix,
)
from xgboost import XGBClassifier

from feature_engineering import build_features

RANDOM_STATE = 42


def load_data():
    transactions = pd.read_csv("data/raw/synthetic_transactions.csv")
    users = pd.read_csv("data/raw/synthetic_users.csv")
    return transactions, users


def evaluate(y_true, y_pred, y_score=None):
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1_score": f1_score(y_true, y_pred, zero_division=0),
    }
    if y_score is not None:
        metrics["roc_auc"] = roc_auc_score(y_true, y_score)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    metrics["confusion_matrix"] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    return metrics


def main():
    print("Loading and engineering features...")
    transactions, users = load_data()
    df, feature_cols = build_features(transactions, users)

    X = df[feature_cols].fillna(0)
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
    print(f"Fraud rate - train: {y_train.mean():.4f}, test: {y_test.mean():.4f}")

    results = {}
    models_dir = "models"

    print("\nTraining Logistic Regression...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    lr = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE)
    lr.fit(X_train_scaled, y_train)
    lr_pred = lr.predict(X_test_scaled)
    lr_score = lr.predict_proba(X_test_scaled)[:, 1]
    results["logistic_regression"] = evaluate(y_test, lr_pred, lr_score)
    joblib.dump({"model": lr, "scaler": scaler}, f"{models_dir}/logistic_regression.joblib")

    print("\nTraining Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200, max_depth=12, class_weight="balanced",
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_score = rf.predict_proba(X_test)[:, 1]
    results["random_forest"] = evaluate(y_test, rf_pred, rf_score)
    joblib.dump(rf, f"{models_dir}/random_forest.joblib")

    print("\nTraining XGBoost...")
    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    xgb = XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.1,
        scale_pos_weight=scale_pos_weight, eval_metric="logloss",
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    xgb_score = xgb.predict_proba(X_test)[:, 1]
    results["xgboost"] = evaluate(y_test, xgb_pred, xgb_score)
    joblib.dump(xgb, f"{models_dir}/xgboost.joblib")

    print("\nTraining Isolation Forest...")
    contamination = max(y_train.mean(), 0.001)
    iso = IsolationForest(
        n_estimators=200, contamination=contamination, random_state=RANDOM_STATE, n_jobs=-1,
    )
    iso.fit(X_train)
    iso_raw_pred = iso.predict(X_test)
    iso_pred = np.where(iso_raw_pred == -1, 1, 0)
    iso_score = -iso.score_samples(X_test)
    results["isolation_forest"] = evaluate(y_test, iso_pred, iso_score)
    joblib.dump(iso, f"{models_dir}/isolation_forest.joblib")

    print("\n" + "="*60)
    print("MODEL COMPARISON")
    print("="*60)
    comparison_rows = []
    for name, m in results.items():
        row = {
            "model": name,
            "accuracy": round(m["accuracy"], 4),
            "precision": round(m["precision"], 4),
            "recall": round(m["recall"], 4),
            "f1_score": round(m["f1_score"], 4),
            "roc_auc": round(m.get("roc_auc", 0), 4),
        }
        comparison_rows.append(row)
        print(f"{name:22s} | Acc: {row['accuracy']:.4f} | Prec: {row['precision']:.4f} | "
              f"Rec: {row['recall']:.4f} | F1: {row['f1_score']:.4f} | ROC-AUC: {row['roc_auc']:.4f}")

    comparison_df = pd.DataFrame(comparison_rows)
    comparison_df.to_csv("data/processed/model_comparison.csv", index=False)

    with open("data/processed/model_results_detailed.json", "w") as f:
        json.dump(results, f, indent=2)

    supervised = comparison_df[comparison_df["model"] != "isolation_forest"]
    best_row = supervised.loc[supervised["f1_score"].idxmax()]
    print(f"\nBest supervised model by F1: {best_row['model']} (F1={best_row['f1_score']})")

    with open("data/processed/best_model.json", "w") as f:
        json.dump({"best_model": best_row["model"], "f1_score": float(best_row["f1_score"])}, f, indent=2)

    with open("models/feature_columns.json", "w") as f:
        json.dump(feature_cols, f, indent=2)

    print("\nAll models and results saved to ai-service/models/ and ai-service/data/processed/")


if __name__ == "__main__":
    main()