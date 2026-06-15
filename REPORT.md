# Project Report — NGO Beneficiary Eligibility Analyzer

**Week 2 | AI + Python**  
**Student:** Atul Biju  
**Stack:** Python · FastAPI · Pandas · Scikit-Learn · SQLite · React · TypeScript

---

## 1. Project Overview

Many NGOs manually review hundreds of applicants to determine eligibility for programs like educational scholarships, food assistance, medical aid, and skill development. This project automates that process using machine learning.

The system takes applicant information (age, income, family size, employment, education, disability status) and predicts whether they are **Eligible** or **Not Eligible** for NGO support — along with a confidence score.

---

## 2. Dataset

A synthetic dataset of **250 beneficiary records** was generated using Python, reflecting realistic distributions seen in NGO applicant pools.

### Fields

| Field | Type | Example |
|-------|------|---------|
| applicant_name | string | Ravi Kumar |
| age | int | 22 |
| family_income | float | 120,000 |
| family_members | int | 5 |
| employment_status | string | Unemployed |
| education_level | string | Secondary |
| disability_status | string | Yes / No |
| eligibility_status | string | Eligible / Not Eligible |

### Distribution

- **Eligible:** 183 records (73%)  
- **Not Eligible:** 67 records (27%)

### Eligibility Logic

Eligibility was assigned using a weighted scoring system:

| Factor | Weight |
|--------|--------|
| Low income (< ₹1L) | +4 |
| Unemployed | +3 |
| Large family (6+ members) | +2 |
| Disability | +2 |
| Low education (No Formal / Primary) | +2 |
| Elderly or minor (age < 18 or > 60) | +1 |

Applicants scoring ≥ 5 (with slight random noise for realism) are marked **Eligible**.

---

## 3. Data Preprocessing

Preprocessing is essential because machine learning models require numerical input. Raw data contains categorical text values that must be converted.

### Steps Applied

**1. Missing Value Handling**  
Rows with null values are dropped before training. In a production system, imputation strategies (mean/mode fill) would be applied.

**2. Label Encoding**  
Categorical columns are converted to integers using `sklearn.preprocessing.LabelEncoder`:

```
employment_status:  Employed=0, Part-time=1, Self-employed=2, Unemployed=3
education_level:    No Formal Education=0, Primary=1, Secondary=2, Undergraduate=3, Postgraduate=4
disability_status:  No=0, Yes=1
eligibility_status: Eligible=0, Not Eligible=1
```

**3. Feature Selection**  
Six features are used for training:  
`age`, `family_income`, `family_members`, `employment_status`, `education_level`, `disability_status`

**Why preprocessing matters:**  
Without it, the model cannot interpret text values. Unclean data (missing values, inconsistent categories) leads to errors or misleading predictions.

---

## 4. Machine Learning Models

### 4.1 Decision Tree

A Decision Tree splits data on the feature that best separates the classes at each node, creating a tree of if-else decisions.

- **Hyperparameters:** `max_depth=6`, `random_state=42`
- **Advantage:** Highly interpretable — can trace exactly why a decision was made
- **Disadvantage:** Prone to overfitting on small datasets

### 4.2 Random Forest

A Random Forest trains many Decision Trees on random subsets of the data and averages their predictions (ensemble learning).

- **Hyperparameters:** `n_estimators=100`, `max_depth=8`, `random_state=42`
- **Advantage:** More accurate and robust, handles noisy data better
- **Disadvantage:** Less interpretable than a single tree

### Training Split

- **80%** of records used for training
- **20%** used for testing (held out, never seen during training)
- Stratified split ensures both classes are proportionally represented in train/test sets

---

## 5. Model Evaluation

### Metrics Explained

| Metric | What it means |
|--------|--------------|
| **Accuracy** | % of total predictions that were correct |
| **Precision** | Of all predicted "Eligible", how many actually were? |
| **Recall** | Of all actual "Eligible" applicants, how many did we catch? |
| **Confusion Matrix** | Full breakdown of true positives, true negatives, false positives, false negatives |

### Why evaluation matters

Accuracy alone can be misleading when classes are imbalanced. In NGO contexts, a **false negative** (marking an eligible person as ineligible) has real human consequences — so Recall is especially important.

---

## 6. Prediction Workflow

```
User Input (age, income, family members, employment, education, disability)
        ↓
  Label Encoding (same encoders fitted during training)
        ↓
  Trained Model (Decision Tree or Random Forest)
        ↓
  predict()        →  Eligible / Not Eligible
  predict_proba()  →  Confidence score (0.0 – 1.0)
        ↓
  API Response: { "prediction": "Eligible", "confidence": 0.89 }
```

**Training vs Prediction:**  
During *training*, the model learns patterns from historical data. During *prediction*, it applies those learned patterns to new, unseen inputs. The encoders fitted at training time must be reused at prediction time — otherwise the numeric values would mean something different.

---

## 7. API Development (FastAPI)

FastAPI was chosen for its automatic OpenAPI schema generation, async support, and Pydantic validation.

### All Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/beneficiaries` | List all records (search + filter support) |
| GET | `/beneficiaries/{id}` | Get single record |
| POST | `/beneficiaries` | Create record |
| PUT | `/beneficiaries/{id}` | Update record |
| DELETE | `/beneficiaries/{id}` | Delete record |
| POST | `/train` | Train model → accuracy, precision, recall, confusion matrix |
| POST | `/predict` | Predict eligibility + confidence |
| GET | `/analytics` | Dashboard stats |
| GET | `/analytics/income-distribution` | Income vs eligibility breakdown |
| GET | `/analytics/education-distribution` | Education vs eligibility breakdown |
| POST | `/upload` | Bulk CSV import |
| GET | `/models/compare` | Training status per algorithm |
| GET | `/health` | System health check |
| GET | `/docs` | Scalar API documentation |

### Data Validation

All inputs are validated by Pydantic v2 schemas — invalid employment statuses, out-of-range ages, or negative incomes are rejected with descriptive 422 errors before reaching the database or model.

---

## 8. How Data Flows Through the System

```
CSV / Manual Entry
       ↓
  FastAPI endpoint (validated by Pydantic)
       ↓
  SQLite database (via SQLAlchemy)
       ↓
  POST /train → Pandas DataFrame → Label Encoding → Model Training → .pkl saved
       ↓
  POST /predict → Encode input → Model.predict() + predict_proba() → Response
```

---

## 9. Testing

**26 tests** cover the full system:

- `TestCreate` — valid creation, invalid employment, education, income, age
- `TestRead` — list, get by ID, search by name, filter by eligibility
- `TestUpdate` — partial update, full update, 404 handling
- `TestDelete` — successful delete, 404 handling
- `TestML` — train requires data, train DT, train RF, train both, predict with/without training, invalid fields
- `TestAnalytics` — analytics with/without data, health check

All 26 pass consistently.

---

## 10. Key Learning Outcomes

Through this project:

- Understood how datasets are structured and why cleaning matters
- Learned the difference between model training and prediction
- Saw how label encoding bridges categorical data and numeric models
- Understood why evaluation metrics beyond accuracy are important
- Built a REST API that exposes ML functionality to any frontend or tool
- Understood how data flows end-to-end: from raw input → feature encoding → model → response
