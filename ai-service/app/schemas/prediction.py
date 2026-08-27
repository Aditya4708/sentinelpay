from pydantic import BaseModel, Field
from typing import Optional, List


class PredictionRequest(BaseModel):
    amount: float
    type: str = Field(..., description="P2P, P2M, QR_PAYMENT, etc.")
    merchant_category: str = "P2P"
    upi_app: str
    bank: str
    hour_of_day: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    latitude: float
    longitude: float
    device_id: str
    txn_velocity_1h: int = 0

    avg_amount: float
    home_device_id: str
    home_lat: float
    home_lon: float
    active_hour_start: int = 7
    active_hour_end: int = 23


class TopFactor(BaseModel):
    factor: str
    impact: float


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    risk_score: float
    is_fraud_predicted: bool
    model_confidence: float
    model_used: str
    top_factors: List[TopFactor]
    human_readable_summary: str