# NGO Beneficiary Eligibility Analyzer

An AI-powered system that helps NGOs determine beneficiary eligibility using machine learning.

## Tech Stack

**Backend**
- FastAPI + Uvicorn
- SQLAlchemy 2.0 (SQLite)
- Pydantic v2
- Pandas + NumPy
- Scikit-Learn (Decision Tree, Random Forest)

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v3
- TanStack Query v5
- Recharts
- React Router v7

## Features

- **Dataset** — 250+ synthetic NGO beneficiary records auto-generated on first run
- **Dashboard** — Live analytics with income, eligibility, employment, and education charts
- **Beneficiaries** — Full CRUD table with search, filter, add, edit, delete
- **ML Training** — Train Decision Tree and/or Random Forest with one click; view Accuracy, Precision, Recall, Confusion Matrix
- **Prediction** — Enter applicant details → get eligibility decision + confidence score
- **CSV Upload** — Bulk-import beneficiary records via CSV
- **Model Comparison** — Side-by-side metrics for both algorithms

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/beneficiaries` | List all (supports `?search=` and `?eligibility=`) |
| GET | `/beneficiaries/{id}` | Get single record |
| POST | `/beneficiaries` | Create record |
| PUT | `/beneficiaries/{id}` | Update record |
| DELETE | `/beneficiaries/{id}` | Delete record |
| POST | `/train` | Train model → returns accuracy, precision, recall, confusion matrix |
| POST | `/predict` | Predict eligibility + confidence score |
| GET | `/analytics` | Dashboard stats |
| GET | `/analytics/income-distribution` | Income vs eligibility chart data |
| GET | `/analytics/education-distribution` | Education vs eligibility chart data |
| POST | `/upload` | Bulk CSV import |
| GET | `/models/compare` | Model training status |
| GET | `/health` | Health check |

## Prediction Request

```json
POST /predict
{
  "age": 22,
  "family_income": 90000,
  "family_members": 5,
  "employment_status": "Unemployed",
  "education_level": "Primary",
  "disability_status": "Yes",
  "algorithm": "random_forest"
}
```

**Response:**
```json
{
  "prediction": "Eligible",
  "confidence": 0.89,
  "algorithm_used": "random_forest"
}
```

## Dataset Fields

| Field | Type | Values |
|-------|------|--------|
| applicant_name | string | — |
| age | int | 5–100 |
| family_income | float | ≥ 0 |
| family_members | int | 1–20 |
| employment_status | string | Unemployed, Part-time, Self-employed, Employed |
| education_level | string | No Formal Education, Primary, Secondary, Undergraduate, Postgraduate |
| disability_status | string | Yes, No |
| eligibility_status | string | Eligible, Not Eligible |

## ML Workflow

```
Data Collection → Data Cleaning → Feature Engineering
      ↓
  Model Training (Decision Tree / Random Forest)
      ↓
  Model Evaluation (Accuracy, Precision, Recall, Confusion Matrix)
      ↓
  Prediction API → Beneficiary Eligibility Result
```

## Running Tests

```bash
cd backend
pytest test_api.py -v
```
