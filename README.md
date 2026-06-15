# NGO Beneficiary Eligibility Analyzer

An AI-powered web app that helps NGOs determine beneficiary eligibility using machine learning — built with FastAPI, scikit-learn, and React.

> Week 2 project · AI + Python track

---

## Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Predict Eligibility
![Predict](docs/screenshots/predict.png)

### Model Training
![Training](docs/screenshots/training.png)

### Beneficiaries Table
![Beneficiaries](docs/screenshots/beneficiaries.png)

> Add your own screenshots to `docs/screenshots/` — the filenames above match.

---

## Features

- **Live Dashboard** — stat cards, eligibility pie chart, employment/education breakdowns, income-vs-eligibility stacked bar
- **Beneficiaries CRUD** — search, filter, add, edit, delete records; bulk import via CSV upload
- **ML Training** — train Decision Tree and/or Random Forest with one click; see Accuracy, Precision, Recall, and Confusion Matrix
- **Eligibility Prediction** — enter applicant details, pick an algorithm, get a decision + confidence score
- **Scalar API Docs** — interactive API reference at `/docs` (no Swagger)
- **Auto-seed** — 250 synthetic records are loaded into the database on first run; nothing to set up manually

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | FastAPI · Uvicorn · SQLAlchemy 2 (SQLite) · Pydantic v2 |
| ML | scikit-learn (Decision Tree, Random Forest) · Pandas · NumPy |
| Frontend | React 19 · TypeScript · Vite · TanStack Query v5 |
| Charts | Recharts |
| Styling | Tailwind CSS v3 · Inter Variable font |
| API Docs | Scalar (`scalar-fastapi`) |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1 — Clone

```bash
git clone https://github.com/Atul013/ngo-eligibility-analyzer.git
cd ngo-eligibility-analyzer
```

### 2 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On first run the server seeds the SQLite database with 250 synthetic beneficiary records automatically. No manual data entry needed.

- API base: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`

### 3 — Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`

### 4 — Train & Predict

1. Go to **Training** → choose an algorithm → click **Start Training**
2. Go to **Predict** → fill in applicant details → click **Run Prediction**

That's it.

---

## Sample Data

The `sample-data/` folder contains 10 test records you can upload via the **Beneficiaries → Upload CSV** button to verify the import flow works correctly.

See [`sample-data/README.md`](sample-data/README.md) for details.

---

## API Reference

Full interactive docs at `http://localhost:8000/docs` (powered by Scalar).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/beneficiaries` | List records (`?search=` · `?eligibility=`) |
| `POST` | `/beneficiaries` | Create a record |
| `PUT` | `/beneficiaries/{id}` | Update a record |
| `DELETE` | `/beneficiaries/{id}` | Delete a record |
| `POST` | `/train` | Train a model; returns accuracy, precision, recall, confusion matrix |
| `POST` | `/predict` | Predict eligibility + confidence score |
| `GET` | `/analytics` | Dashboard aggregates |
| `GET` | `/analytics/income-distribution` | Income-bracket breakdown by eligibility |
| `POST` | `/upload` | Bulk CSV import |
| `GET` | `/models/compare` | Training status for both algorithms |
| `GET` | `/health` | Health check |

### Example — Predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 24,
    "family_income": 85000,
    "family_members": 5,
    "employment_status": "Unemployed",
    "education_level": "Secondary",
    "disability_status": "No",
    "algorithm": "random_forest"
  }'
```

```json
{
  "prediction": "Eligible",
  "confidence": 0.91,
  "algorithm_used": "random_forest"
}
```

---

## Running Tests

```bash
cd backend
pytest test_api.py -v
```

26 tests covering CRUD, ML training, prediction, and analytics endpoints.

---

## Eligibility Logic (Training Data)

Eligibility in the synthetic dataset is scored on six factors:

| Factor | Weight |
|--------|--------|
| Family income < ₹1L/yr | +4 |
| Unemployed | +3 |
| Family members ≥ 5 | +2 |
| Disability | +2 |
| Education ≤ Secondary | +2 |
| Age < 35 | +1 |

**Score ≥ 5 → Eligible.** The ML models learn this boundary from the data.

---

## Project Structure

```
ngo-eligibility-analyzer/
├── backend/
│   ├── main.py              # FastAPI app, routes, lifespan seed
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # DB session setup
│   ├── requirements.txt
│   ├── test_api.py          # 26 pytest tests
│   ├── data/
│   │   └── beneficiaries.csv   # 250 synthetic records (seed data)
│   └── ml/
│       ├── dataset.py       # Synthetic data generator
│       ├── trainer.py       # Model training + evaluation
│       └── predictor.py     # Inference
├── frontend/
│   └── src/
│       ├── pages/           # Dashboard, Beneficiaries, Predict, Training
│       ├── components/      # Layout, sidebar
│       └── api/             # Axios client + typed endpoints
├── sample-data/
│   ├── sample_beneficiaries.csv   # 10 test records for upload testing
│   └── README.md
└── REPORT.md
```
