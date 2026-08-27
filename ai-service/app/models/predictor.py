import json
import numpy as np
import joblib
import shap

from app.schemas.prediction import PredictionRequest, TopFactor, PredictionResponse


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c


TYPE_CODES = {"P2P": 0, "P2M": 1, "QR_PAYMENT": 2, "BILL_PAYMENT": 3, "RECHARGE": 4, "MERCHANT_PAYMENT": 5, "SUBSCRIPTION": 6}
MERCHANT_CODES = {"P2P": 0, "Food & Dining": 1, "E-commerce": 2, "Groceries": 3, "Travel": 4, "Utilities": 5, "Entertainment": 6, "Healthcare": 7, "Suspicious": 8}
APP_CODES = {"PhonePe": 0, "GPay": 1, "Paytm": 2, "BHIM": 3, "Amazon Pay": 4}
BANK_CODES = {"SBI": 0, "HDFC": 1, "ICICI": 2, "Axis": 3, "Bank of Baroda": 4, "Kotak Mahindra": 5, "Punjab National Bank": 6}

FRIENDLY_NAMES = {
    "amount": "Transaction Amount",
    "amount_log": "Transaction Amount",
    "amount_vs_avg_ratio": "Amount vs Usual Spending",
    "hour_of_day": "Time of Transaction",
    "day_of_week": "Day of Week",
    "is_odd_hour": "Unusual Hour",
    "is_new_device": "New Device",
    "is_new_city": "Different City",
    "distance_from_home_km": "Distance from Home",
    "is_suspicious_merchant": "Suspicious Merchant",
    "txn_velocity_1h": "Rapid Transaction Frequency",
    "type_code": "Transaction Type",
    "merchant_category_code": "Merchant Category",
    "upi_app_code": "UPI App",
    "bank_code": "Bank",
}


class FraudPredictor:
    def __init__(self, model_path="models/random_forest.joblib", features_path="models/feature_columns.json"):
        self.model = joblib.load(model_path)
        with open(features_path) as f:
            self.feature_cols = json.load(f)
        self.explainer = shap.TreeExplainer(self.model)
        self.model_name = "random_forest_v1"

    def _build_feature_vector(self, req: PredictionRequest) -> np.ndarray:
        amount_vs_avg_ratio = req.amount / max(req.avg_amount, 1)
        amount_log = np.log1p(req.amount)
        is_odd_hour = int(req.hour_of_day < req.active_hour_start or req.hour_of_day > req.active_hour_end)
        is_new_device = int(req.device_id != req.home_device_id)
        distance = haversine_km(req.latitude, req.longitude, req.home_lat, req.home_lon)
        is_new_city = int(distance > 50)
        is_suspicious_merchant = int(req.merchant_category == "Suspicious")

        row = {
            "amount": req.amount,
            "amount_log": amount_log,
            "amount_vs_avg_ratio": amount_vs_avg_ratio,
            "hour_of_day": req.hour_of_day,
            "day_of_week": req.day_of_week,
            "is_odd_hour": is_odd_hour,
            "is_new_device": is_new_device,
            "is_new_city": is_new_city,
            "distance_from_home_km": distance,
            "is_suspicious_merchant": is_suspicious_merchant,
            "txn_velocity_1h": req.txn_velocity_1h,
            "type_code": TYPE_CODES.get(req.type, 0),
            "merchant_category_code": MERCHANT_CODES.get(req.merchant_category, 0),
            "upi_app_code": APP_CODES.get(req.upi_app, 0),
            "bank_code": BANK_CODES.get(req.bank, 0),
        }

        return np.array([[row[c] for c in self.feature_cols]]), row

    def _human_summary(self, top_factors, is_fraud):
        if not is_fraud:
            return "Transaction appears consistent with the user's normal behavior."
        factor_names = [f.factor for f in top_factors[:3]]
        return "Flagged due to: " + ", ".join(factor_names) + "."

    def predict(self, req: PredictionRequest) -> PredictionResponse:
        X, row = self._build_feature_vector(req)

        proba = self.model.predict_proba(X)[0][1]
        is_fraud = bool(proba >= 0.5)

        shap_values = self.explainer.shap_values(X)
        # Handle the different shapes SHAP can return across versions:
        # - list of arrays: [class0_array, class1_array], each (samples, features)
        # - 3D ndarray: (samples, features, classes)
        # - 2D ndarray: (samples, features) - already binary/single-output
        if isinstance(shap_values, list):
            fraud_shap = np.array(shap_values[1][0]).flatten()
        else:
            arr = np.array(shap_values)
            if arr.ndim == 3:
                fraud_shap = arr[0, :, 1].flatten()
            else:
                fraud_shap = arr[0].flatten()

        impacts = list(zip(self.feature_cols, fraud_shap))
        impacts.sort(key=lambda x: abs(x[1]), reverse=True)

        top_factors = [
            TopFactor(factor=FRIENDLY_NAMES.get(name, name), impact=round(float(val), 4))
            for name, val in impacts[:5]
        ]

        summary = self._human_summary(top_factors, is_fraud)

        return PredictionResponse(
            risk_score=round(float(proba) * 100, 2),
            is_fraud_predicted=is_fraud,
            model_confidence=round(float(max(proba, 1 - proba)) * 100, 2),
            model_used=self.model_name,
            top_factors=top_factors,
            human_readable_summary=summary,
        )


predictor = FraudPredictor()