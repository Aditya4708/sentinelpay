"""
RiskLens AI - Feature Engineering (Module 5)

Turns raw transaction + user data into ML-ready features. Every feature here
is something an admin could plausibly explain in plain English later via
SHAP/LIME - that's intentional, since explainability is a project pillar.
"""

import numpy as np
import pandas as pd


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c


def build_features(transactions: pd.DataFrame, users: pd.DataFrame) -> pd.DataFrame:
    df = transactions.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    user_cols = [
        "user_id", "home_device_id", "home_city", "home_lat", "home_lon",
        "avg_amount", "active_hour_start", "active_hour_end",
    ]
    df = df.merge(users[user_cols], left_on="sender_user_id", right_on="user_id", how="left")

    df["amount_vs_avg_ratio"] = df["amount"] / df["avg_amount"].replace(0, 1)
    df["amount_log"] = np.log1p(df["amount"])

    df["hour_of_day"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_odd_hour"] = (
        (df["hour_of_day"] < df["active_hour_start"]) |
        (df["hour_of_day"] > df["active_hour_end"])
    ).astype(int)

    df["is_new_device"] = (df["device_id"] != df["home_device_id"]).astype(int)
    df["is_new_city"] = (df["city"] != df["home_city"]).astype(int)
    df["distance_from_home_km"] = haversine_km(
        df["latitude"], df["longitude"], df["home_lat"], df["home_lon"]
    )

    df["is_suspicious_merchant"] = (df["merchant_category"] == "Suspicious").astype(int)

    df = df.sort_values(["sender_user_id", "timestamp"]).reset_index(drop=True)
    velocity = np.zeros(len(df))
    for user_id, group in df.groupby("sender_user_id"):
        times = group["timestamp"].values
        idxs = group.index.values
        for i in range(len(times)):
            window_start = times[i] - np.timedelta64(60, "m")
            count = np.sum((times >= window_start) & (times <= times[i])) - 1
            velocity[idxs[i]] = count
    df["txn_velocity_1h"] = velocity

    feature_cols = [
        "amount", "amount_log", "amount_vs_avg_ratio",
        "hour_of_day", "day_of_week", "is_odd_hour",
        "is_new_device", "is_new_city", "distance_from_home_km",
        "is_suspicious_merchant", "txn_velocity_1h",
    ]

    return df, feature_cols