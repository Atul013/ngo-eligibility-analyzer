import numpy as np
from .trainer import load_model

EDUCATION_ORDER = [
    "No Formal Education", "Primary", "Secondary", "Undergraduate", "Postgraduate"
]


def predict_eligibility(
    age: int,
    family_income: float,
    family_members: int,
    employment_status: str,
    education_level: str,
    disability_status: str,
    algorithm: str = "random_forest",
) -> dict:
    model, encoders, target_encoder = load_model(algorithm)
    if model is None:
        raise RuntimeError("Model not trained yet. Call POST /train first.")

    def safe_encode(encoder, value, col):
        classes = list(encoder.classes_)
        if value not in classes:
            raise ValueError(f"Unknown value '{value}' for field '{col}'. Valid: {classes}")
        return encoder.transform([value])[0]

    emp_enc = safe_encode(encoders["employment_status"], employment_status, "employment_status")
    edu_enc = safe_encode(encoders["education_level"], education_level, "education_level")
    dis_enc = safe_encode(encoders["disability_status"], disability_status, "disability_status")

    features = np.array([[age, family_income, family_members, emp_enc, edu_enc, dis_enc]])

    pred_idx = model.predict(features)[0]
    prediction = target_encoder.inverse_transform([pred_idx])[0]

    proba = model.predict_proba(features)[0]
    confidence = float(proba[pred_idx])

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "algorithm_used": algorithm,
    }
