import io
import os
from contextlib import asynccontextmanager
from typing import Optional

import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from ml.dataset import load_or_generate, DATA_PATH, save_dataset
from ml.trainer import train_model, train_both, is_trained
from ml.predictor import predict_eligibility


def _seed_db_from_csv(db: Session):
    count = db.query(models.Beneficiary).count()
    if count > 0:
        return
    df = load_or_generate()
    for _, row in df.iterrows():
        db.add(models.Beneficiary(
            applicant_name=row["applicant_name"],
            age=int(row["age"]),
            family_income=float(row["family_income"]),
            family_members=int(row["family_members"]),
            employment_status=row["employment_status"],
            education_level=row["education_level"],
            disability_status=row["disability_status"],
            eligibility_status=row["eligibility_status"],
        ))
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        _seed_db_from_csv(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="NGO Beneficiary Eligibility Analyzer",
    description="AI-powered system to determine NGO beneficiary eligibility using ML.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Beneficiaries CRUD ──────────────────────────────────────────────────────

@app.get("/beneficiaries", response_model=list[schemas.BeneficiaryResponse], tags=["Beneficiaries"])
def list_beneficiaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    eligibility: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Beneficiary)
    if search:
        q = q.filter(models.Beneficiary.applicant_name.ilike(f"%{search}%"))
    if eligibility:
        q = q.filter(models.Beneficiary.eligibility_status == eligibility)
    return q.offset(skip).limit(limit).all()


@app.get("/beneficiaries/{beneficiary_id}", response_model=schemas.BeneficiaryResponse, tags=["Beneficiaries"])
def get_beneficiary(beneficiary_id: int, db: Session = Depends(get_db)):
    record = db.query(models.Beneficiary).filter(models.Beneficiary.id == beneficiary_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    return record


@app.post("/beneficiaries", response_model=schemas.BeneficiaryResponse, status_code=201, tags=["Beneficiaries"])
def create_beneficiary(payload: schemas.BeneficiaryCreate, db: Session = Depends(get_db)):
    record = models.Beneficiary(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.put("/beneficiaries/{beneficiary_id}", response_model=schemas.BeneficiaryResponse, tags=["Beneficiaries"])
def update_beneficiary(
    beneficiary_id: int,
    payload: schemas.BeneficiaryUpdate,
    db: Session = Depends(get_db),
):
    record = db.query(models.Beneficiary).filter(models.Beneficiary.id == beneficiary_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@app.delete("/beneficiaries/{beneficiary_id}", status_code=204, tags=["Beneficiaries"])
def delete_beneficiary(beneficiary_id: int, db: Session = Depends(get_db)):
    record = db.query(models.Beneficiary).filter(models.Beneficiary.id == beneficiary_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    db.delete(record)
    db.commit()


# ── ML Endpoints ────────────────────────────────────────────────────────────

@app.post("/train", tags=["ML"])
def train(payload: schemas.TrainRequest, db: Session = Depends(get_db)):
    records = db.query(models.Beneficiary).all()
    if len(records) < 20:
        raise HTTPException(status_code=400, detail="Need at least 20 records to train.")

    df = pd.DataFrame([{
        "age": r.age,
        "family_income": r.family_income,
        "family_members": r.family_members,
        "employment_status": r.employment_status,
        "education_level": r.education_level,
        "disability_status": r.disability_status,
        "eligibility_status": r.eligibility_status,
    } for r in records])

    if payload.algorithm == "both":
        return train_both(df)
    return train_model(df, payload.algorithm)


@app.post("/predict", response_model=schemas.PredictResponse, tags=["ML"])
def predict(payload: schemas.PredictRequest):
    if not is_trained(payload.algorithm):
        raise HTTPException(
            status_code=400,
            detail=f"Model '{payload.algorithm}' not trained yet. Call POST /train first.",
        )
    try:
        result = predict_eligibility(
            age=payload.age,
            family_income=payload.family_income,
            family_members=payload.family_members,
            employment_status=payload.employment_status,
            education_level=payload.education_level,
            disability_status=payload.disability_status,
            algorithm=payload.algorithm,
        )
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@app.get("/models/compare", tags=["ML"])
def compare_models():
    results = {}
    for algo in ["decision_tree", "random_forest"]:
        if is_trained(algo):
            results[algo] = {"trained": True}
        else:
            results[algo] = {"trained": False}
    return results


# ── Analytics ───────────────────────────────────────────────────────────────

@app.get("/analytics", response_model=schemas.AnalyticsResponse, tags=["Analytics"])
def analytics(db: Session = Depends(get_db)):
    records = db.query(models.Beneficiary).all()
    if not records:
        raise HTTPException(status_code=404, detail="No data available")

    df = pd.DataFrame([{
        "eligibility_status": r.eligibility_status,
        "family_income": r.family_income,
        "age": r.age,
        "family_members": r.family_members,
        "employment_status": r.employment_status,
        "education_level": r.education_level,
        "disability_status": r.disability_status,
    } for r in records])

    return {
        "total_applicants": len(df),
        "eligible_count": int((df["eligibility_status"] == "Eligible").sum()),
        "not_eligible_count": int((df["eligibility_status"] == "Not Eligible").sum()),
        "average_income": round(float(df["family_income"].mean()), 2),
        "average_age": round(float(df["age"].mean()), 2),
        "average_family_members": round(float(df["family_members"].mean()), 2),
        "employment_breakdown": df["employment_status"].value_counts().to_dict(),
        "education_breakdown": df["education_level"].value_counts().to_dict(),
        "disability_breakdown": df["disability_status"].value_counts().to_dict(),
    }


@app.get("/analytics/income-distribution", tags=["Analytics"])
def income_distribution(db: Session = Depends(get_db)):
    records = db.query(models.Beneficiary).all()
    df = pd.DataFrame([{"family_income": r.family_income, "eligibility_status": r.eligibility_status} for r in records])
    bins = [0, 100000, 200000, 300000, 400000, 500000, float("inf")]
    labels = ["<1L", "1-2L", "2-3L", "3-4L", "4-5L", ">5L"]
    df["income_range"] = pd.cut(df["family_income"], bins=bins, labels=labels)
    result = df.groupby("income_range", observed=True)["eligibility_status"].value_counts().unstack(fill_value=0)
    return result.to_dict()


@app.get("/analytics/education-distribution", tags=["Analytics"])
def education_distribution(db: Session = Depends(get_db)):
    records = db.query(models.Beneficiary).all()
    df = pd.DataFrame([{"education_level": r.education_level, "eligibility_status": r.eligibility_status} for r in records])
    result = df.groupby("education_level")["eligibility_status"].value_counts().unstack(fill_value=0)
    return result.to_dict()


# ── CSV Upload ──────────────────────────────────────────────────────────────

REQUIRED_COLS = {
    "applicant_name", "age", "family_income", "family_members",
    "employment_status", "education_level", "disability_status", "eligibility_status",
}


@app.post("/upload", tags=["Data"])
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing columns: {missing}")

    df = df.dropna(subset=list(REQUIRED_COLS))
    inserted = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            record = models.Beneficiary(
                applicant_name=str(row["applicant_name"]),
                age=int(row["age"]),
                family_income=float(row["family_income"]),
                family_members=int(row["family_members"]),
                employment_status=str(row["employment_status"]),
                education_level=str(row["education_level"]),
                disability_status=str(row["disability_status"]),
                eligibility_status=str(row["eligibility_status"]),
            )
            db.add(record)
            inserted += 1
        except Exception as e:
            errors.append({"row": int(idx), "error": str(e)})

    db.commit()
    return {"inserted": inserted, "skipped": len(errors), "errors": errors[:10]}


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "models_trained": {
        "decision_tree": is_trained("decision_tree"),
        "random_forest": is_trained("random_forest"),
    }}
