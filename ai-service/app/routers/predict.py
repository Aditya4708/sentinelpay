from fastapi import APIRouter
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.models.predictor import predictor

router = APIRouter()


@router.post("/", response_model=PredictionResponse)
def predict_fraud(request: PredictionRequest):
    return predictor.predict(request)