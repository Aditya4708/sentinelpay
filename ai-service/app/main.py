from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict

app = FastAPI(
    title="SentinelPay - Fraud Detection Service",
    description="Real-time UPI fraud risk scoring with SHAP explainability.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "risklens-ai-service"}


app.include_router(predict.router, prefix="/predict", tags=["Prediction"])