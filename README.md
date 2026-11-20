# SentinelPay

### AI-powered UPI fraud detection and risk intelligence platform

SentinelPay scores UPI payments in real time and explains every score. It combines a Random Forest
model, a rule engine that administrators can edit while the system runs, and a payee check for
scam-looking UPI IDs. Analysts review flagged payments, and their decisions feed back into the system.

The data is synthetic and the payments come from a simulator. No real banking data is used.

---

## Features

- **Transaction simulator.** Describe a payment (amount, payee, app, bank, hour, velocity, device) or start
  from one of four real-world scenario cards, and get a risk score at once.
- **Explainable scores.** Every result shows the factors that raised or lowered the score (SHAP), the rules
  that fired and what the system knows about the sender's habits.
- **Behaviour profile.** Each user's usual amount, devices and active hours are learned and compared with
  every new payment.
- **UPI scanner.** Check a UPI ID, the text of a QR code or an uploaded QR image before paying. Look-alike
  addresses such as `amaz0n.refund@ybl` are rated Low, Medium, High or Critical.
- **Scam Shield.** Warns the user before the PIN is entered when a payment request looks like a collect scam.
- **Case review.** Flagged payments go to an analyst queue; confirm or dismiss decisions are stored.
- **Admin tools.** Editable fraud rules (no redeploy), platform overview and analytics.
- **Interface.** Landing page with a live India transaction map, light, dark and system themes,
  JWT login with USER and ADMIN roles.

## How a payment is judged

1. The payment reaches the backend with amount, device, time and, when given, the payee address.
2. The backend loads the sender's behaviour profile.
3. The AI service scores it with a Random Forest on 11 behavioural features.
4. Active rules add their weight, and the payee check adds up to 25 points for a risky address.
5. The final score (0 to 100), the reasons and any flags are saved and shown.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, framer-motion, recharts |
| Backend | Node.js, Express, Swagger |
| AI service | Python, FastAPI, scikit-learn, SHAP |
| Database | PostgreSQL through Prisma 5.22.0 (do not upgrade) |
| Cache | Redis (light use) |
| Infrastructure | Docker Compose |

## Project structure

```
sentinelpay/
├── frontend/          React + TypeScript + Tailwind
├── backend/           Node.js + Express + Prisma
├── ai-service/        Python + FastAPI + model training scripts
├── nginx/             Reverse proxy config
├── docs/              Architecture notes, build plan
└── docker-compose.yml
```

## Getting started

Requires Docker Desktop.

```bash
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

# 6. Train the model (optional, for retraining)
docker compose exec ai-service sh -c "PYTHONPATH=/app/scripts python scripts/train_models.py"
```

On Windows PowerShell, use `Copy-Item` in place of `cp`.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API docs (Swagger) | http://localhost:4000/api/docs |
| AI service docs | http://localhost:8000/docs |
| Database browser | `docker compose exec backend npx prisma studio`, then http://localhost:5555 |

## Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | aditya@example.com | Password@123 |
| User | user1@example.com | Password@123 |

## Model performance

Four models were compared (Logistic Regression, Random Forest, XGBoost, Isolation Forest). Random Forest was
chosen. After an audit that removed four categorical features that let the model learn the generator
rather than the fraud, the final model uses 11 behavioural features:

| Metric | Value |
|---|---|
| F1 score | 0.7987 |
| ROC-AUC | 0.9437 |
| Precision | 0.7785 |
| Recall | 0.82 |

Rules add no measurable accuracy on this data (hybrid F1 0.7961). Their value is policy control and fast
reaction, not a higher score. The full comparison, the audit and the limits of the synthetic data are in the
project report.

## Team

- Aditya Nambiar (10204)
- Risa Rebello (10462)
- Satina Varghese (10217)

Guide: Niraj Singh Yeotikar, Assistant Professor

Department of Computer Engineering, Fr. Conceicao Rodrigues College of Engineering
