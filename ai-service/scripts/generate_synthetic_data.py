"""
RiskLens AI - Synthetic UPI Transaction Generator (Module 4)

Generates realistic Indian UPI users and transactions with injected fraud
patterns. Outputs two CSVs used for ML training (Module 5):
  - data/raw/synthetic_users.csv
  - data/raw/synthetic_transactions.csv

Each transaction carries a ground-truth is_fraud label and fraud_type,
so this is a supervised dataset despite being synthetic.
"""

import csv
import random
import uuid
from datetime import datetime, timedelta

import numpy as np
from faker import Faker

from data_config import (
    CITIES, BANKS, UPI_APPS, MERCHANT_CATEGORIES, DEVICE_OS,
    FRAUD_TYPES, BLACKLISTED_MERCHANTS, MULE_DEVICE_IDS,
)

fake = Faker("en_IN")
random.seed(42)
np.random.seed(42)

NUM_USERS = 300
NUM_TRANSACTIONS = 50000
FRAUD_RATIO = 0.03
SIMULATION_DAYS = 90

TXN_TYPES_WEIGHTED = (
    ["P2P"] * 30 + ["P2M"] * 15 + ["QR_PAYMENT"] * 20 + ["BILL_PAYMENT"] * 10 +
    ["RECHARGE"] * 10 + ["MERCHANT_PAYMENT"] * 10 + ["SUBSCRIPTION"] * 5
)


def build_users(n):
    users = []
    for i in range(n):
        home = random.choice(CITIES)
        avg_amount = float(np.random.lognormal(mean=6.5, sigma=0.8))
        avg_amount = max(50, min(avg_amount, 20000))

        users.append({
            "user_id": str(uuid.uuid4()),
            "name": fake.name(),
            "email": fake.unique.email(),
            "phone": "9" + str(fake.unique.random_number(digits=9, fix_len=True)),
            "upi_id": fake.user_name() + "@ok" + random.choice(BANKS).lower().replace(" ", ""),
            "home_bank": random.choice(BANKS),
            "home_app": random.choice(UPI_APPS),
            "home_city": home["city"],
            "home_state": home["state"],
            "home_lat": home["lat"],
            "home_lon": home["lon"],
            "home_device_id": "dev-" + uuid.uuid4().hex[:12],
            "home_os": random.choice(DEVICE_OS),
            "avg_amount": round(avg_amount, 2),
            "active_hour_start": random.randint(6, 9),
            "active_hour_end": random.randint(20, 23),
        })
    return users


def random_timestamp_within_active_hours(user, days_back):
    day_offset = random.randint(0, days_back)
    hour = random.randint(user["active_hour_start"], user["active_hour_end"])
    minute = random.randint(0, 59)
    dt = datetime.now() - timedelta(days=day_offset)
    return dt.replace(hour=hour, minute=minute, second=random.randint(0, 59), microsecond=0)


def pick_merchant():
    category = random.choice(list(MERCHANT_CATEGORIES.keys()))
    merchants = MERCHANT_CATEGORIES[category]
    merchant = random.choice(merchants) if merchants else None
    return category, merchant


def build_normal_transaction(user, txn_id, days_back=SIMULATION_DAYS):
    txn_type = random.choice(TXN_TYPES_WEIGHTED)
    category, merchant = pick_merchant() if txn_type != "P2P" else ("P2P", None)

    amount = float(np.random.normal(loc=user["avg_amount"], scale=user["avg_amount"] * 0.35))
    amount = round(max(20, amount), 2)

    timestamp = random_timestamp_within_active_hours(user, days_back)

    # Occasionally the user travels - small jitter, still plausible
    lat = user["home_lat"] + np.random.normal(0, 0.05)
    lon = user["home_lon"] + np.random.normal(0, 0.05)

    return {
        "txn_id": str(uuid.uuid4()),
        "txn_ref": "UTR" + uuid.uuid4().hex[:12].upper(),
        "sender_user_id": user["user_id"],
        "type": txn_type,
        "amount": amount,
        "upi_app": user["home_app"],
        "bank": user["home_bank"],
        "merchant_category": category,
        "merchant_name": merchant,
        "city": user["home_city"],
        "state": user["home_state"],
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "device_id": user["home_device_id"],
        "os": user["home_os"],
        "timestamp": timestamp.isoformat(),
        "status": "SUCCESS",
        "is_fraud": 0,
        "fraud_type": "",
    }


def inject_fraud(user, base_txn, fraud_type):
    txn = dict(base_txn)
    txn["is_fraud"] = 1
    txn["fraud_type"] = fraud_type

    if fraud_type == "HIGH_VALUE":
        txn["amount"] = round(user["avg_amount"] * random.uniform(8, 25), 2)

    elif fraud_type == "NEW_DEVICE":
        txn["device_id"] = "dev-" + uuid.uuid4().hex[:12]
        txn["os"] = random.choice(DEVICE_OS)

    elif fraud_type == "ODD_HOUR":
        ts = datetime.fromisoformat(txn["timestamp"])
        ts = ts.replace(hour=random.choice([0, 1, 2, 3, 4]), minute=random.randint(0, 59))
        txn["timestamp"] = ts.isoformat()

    elif fraud_type == "IMPOSSIBLE_TRAVEL":
        far_city = random.choice([c for c in CITIES if c["city"] != user["home_city"]])
        txn["city"] = far_city["city"]
        txn["state"] = far_city["state"]
        txn["latitude"] = far_city["lat"]
        txn["longitude"] = far_city["lon"]

    elif fraud_type == "BLACKLISTED_MERCHANT":
        txn["merchant_category"] = "Suspicious"
        txn["merchant_name"] = random.choice(BLACKLISTED_MERCHANTS)
        txn["type"] = "MERCHANT_PAYMENT"
        txn["amount"] = round(user["avg_amount"] * random.uniform(2, 6), 2)

    elif fraud_type == "MULE_NETWORK":
        # Deliberately reuses one of a small pool of device IDs across many
        # different victim accounts - the real signature of a mule-account
        # fraud ring, and a signal a per-transaction model cannot see alone.
        txn["device_id"] = random.choice(MULE_DEVICE_IDS)
        txn["os"] = random.choice(DEVICE_OS)
        txn["amount"] = round(user["avg_amount"] * random.uniform(1.5, 4), 2)

    # RAPID_SUCCESSION handled separately as a burst, not a single-txn mutation

    return txn


def build_rapid_succession_burst(user):
    burst = []
    base_time = random_timestamp_within_active_hours(user, SIMULATION_DAYS)
    burst_size = random.randint(3, 6)
    for i in range(burst_size):
        txn = build_normal_transaction(user, None)
        txn["timestamp"] = (base_time + timedelta(seconds=i * random.randint(5, 20))).isoformat()
        txn["is_fraud"] = 1
        txn["fraud_type"] = "RAPID_SUCCESSION"
        txn["amount"] = round(user["avg_amount"] * random.uniform(0.5, 1.5), 2)
        burst.append(txn)
    return burst


def generate_dataset():
    print(f"Generating {NUM_USERS} users...")
    users = build_users(NUM_USERS)

    print(f"Generating ~{NUM_TRANSACTIONS} transactions (fraud ratio {FRAUD_RATIO})...")
    transactions = []
    num_fraud_target = int(NUM_TRANSACTIONS * FRAUD_RATIO)
    num_normal = NUM_TRANSACTIONS - num_fraud_target

    for _ in range(num_normal):
        user = random.choice(users)
        transactions.append(build_normal_transaction(user, None))

    fraud_generated = 0
    while fraud_generated < num_fraud_target:
        user = random.choice(users)
        fraud_type = random.choice(FRAUD_TYPES)

        if fraud_type == "RAPID_SUCCESSION":
            burst = build_rapid_succession_burst(user)
            transactions.extend(burst)
            fraud_generated += len(burst)
        else:
            base = build_normal_transaction(user, None)
            fraud_txn = inject_fraud(user, base, fraud_type)
            transactions.append(fraud_txn)
            fraud_generated += 1

    random.shuffle(transactions)
    return users, transactions


def write_csv(path, rows, fieldnames):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {path}")


if __name__ == "__main__":
    users, transactions = generate_dataset()

    user_fields = list(users[0].keys())
    write_csv("data/raw/synthetic_users.csv", users, user_fields)

    txn_fields = list(transactions[0].keys())
    write_csv("data/raw/synthetic_transactions.csv", transactions, txn_fields)

    fraud_count = sum(1 for t in transactions if t["is_fraud"] == 1)
    print("")
    print("Summary:")
    print(f"  Total transactions: {len(transactions)}")
    print(f"  Fraud transactions: {fraud_count} ({fraud_count / len(transactions) * 100:.2f}%)")
    print(f"  Normal transactions: {len(transactions) - fraud_count}")