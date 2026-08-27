# SentinelPay

### AI-Powered UPI Fraud Detection & Risk Intelligence Platform using Explainable AI and Behavioral Analytics

A full-stack fintech platform that simulates the Indian UPI ecosystem and detects fraudulent
transactions in real time using Machine Learning, a configurable rule engine, and Explainable AI (SHAP).

---

## Tech Stack

- **Frontend:** React (Vite, TypeScript, Tailwind CSS)
- **Backend:** Node.js + Express (JavaScript)
- **AI Service:** Python + FastAPI (scikit-learn, XGBoost, SHAP)
- **Database:** PostgreSQL (via Prisma ORM)
- **Cache:** Redis
- **Infrastructure:** Docker Compose

## Features

- JWT-based authentication with role-based access control (USER / ADMIN)
- Synthetic UPI transaction generator (50,000+ transactions, 6 labeled fraud patterns)
- 4 trained ML models compared (Logistic Regression, Random Forest, XGBoost, Isolation Forest)
- Real-time fraud scoring with SHAP-based explainability
- Admin-configurable rule engine that combines with the ML score at runtime, no redeployment required
- Responsive dashboard, transaction simulator, transaction history, risk alerts, and admin analytics
- Interactive API documentation (Swagger for the backend, auto-docs for the AI service)

## Project Structure

\\\
sentinelpay/
├── frontend/          React + TypeScript + Tailwind
├── backend/           Node.js + Express
├── ai-service/        Python + FastAPI
├── nginx/             Reverse proxy config
├── docs/              Architecture notes, build plan
└── docker-compose.yml
\\\

## Getting Started

\\\ash
# 1. Configure environment files
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env

# 2. Start everything
docker compose up --build

# 3. Run database migrations (first time only)
docker compose exec backend npx prisma migrate dev

# 4. Seed demo users and fraud rules
docker compose exec backend node prisma/seed.js
docker compose exec backend node prisma/seedRules.js

# 5. Generate synthetic training data (optional, for retraining)
docker compose exec ai-service sh -c "PYTHONPATH=/app/scripts python scripts/generate_synthetic_data.py"

# 6. Train the ML models (optional, for retraining)
docker compose exec ai-service sh -c "PYTHONPATH=/app/scripts python scripts/train_models.py"
\\\

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:4000/api/docs
- AI service docs: http://localhost:8000/docs
- Database browser: \docker compose exec backend npx prisma studio\ → http://localhost:5555

## Demo Accounts (after seeding)

| Role  | Email                | Password      |
|-------|-----------------------|--------------|
| Admin | aditya@example.com    | Password@123 |
| User  | user1@example.com     | Password@123 |

## Model Performance

| Model               | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
|---------------------|----------|-----------|--------|----------|---------|
| Logistic Regression | 0.9407   | 0.3211    | 0.8767 | 0.4701   | 0.9560  |
| Random Forest       | 0.9904   | 0.8493    | 0.8267 | 0.8378   | 0.9644  |
| XGBoost             | 0.9877   | 0.7757    | 0.8300 | 0.8019   | 0.9598  |
| Isolation Forest    | 0.9676   | 0.4603    | 0.4633 | 0.4618   | 0.8968  |

Random Forest was selected as the production model based on F1 score.

## Team

- Aditya Nambiar — 10204
- Risa Rebello — 10462
- Satina Varghese — 10217

Department of Computer Engineering, Fr. Conceicao Rodrigues College of Engineering