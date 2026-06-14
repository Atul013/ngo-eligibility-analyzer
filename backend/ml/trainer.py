import os
import pickle
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, confusion_matrix, classification_report
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

FEATURE_COLS = [
    "age", "family_income", "family_members",
    "employment_status", "education_level", "disability_status",
]
TARGET_COL = "eligibility_status"

ENCODERS: dict[str, LabelEncoder] = {}


def _preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    df = df.copy()
    df.dropna(inplace=True)

    encoders = {}
    for col in ["employment_status", "education_level", "disability_status"]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    return df, encoders


def _encode_target(series: pd.Series) -> tuple[np.ndarray, LabelEncoder]:
    le = LabelEncoder()
    encoded = le.fit_transform(series.astype(str))
    return encoded, le


def train_model(df: pd.DataFrame, algorithm: str = "random_forest") -> dict:
    df_clean, encoders = _preprocess(df)

    X = df_clean[FEATURE_COLS].values
    y_raw, target_encoder = _encode_target(df_clean[TARGET_COL])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_raw, test_size=0.2, random_state=42, stratify=y_raw
    )

    if algorithm == "decision_tree":
        model = DecisionTreeClassifier(max_depth=6, random_state=42)
    else:
        model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(
        y_test, y_pred,
        target_names=target_encoder.classes_,
        output_dict=True,
        zero_division=0,
    )

    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, f"{algorithm}.pkl")
    encoder_path = os.path.join(MODEL_DIR, f"{algorithm}_encoders.pkl")
    target_enc_path = os.path.join(MODEL_DIR, f"{algorithm}_target_enc.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(encoder_path, "wb") as f:
        pickle.dump(encoders, f)
    with open(target_enc_path, "wb") as f:
        pickle.dump(target_encoder, f)

    class_counts = dict(zip(
        target_encoder.classes_.tolist(),
        np.bincount(y_raw).tolist()
    ))

    return {
        "algorithm": algorithm,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "confusion_matrix": cm,
        "class_distribution": class_counts,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classification_report": report,
    }


def train_both(df: pd.DataFrame) -> dict:
    dt_result = train_model(df, "decision_tree")
    rf_result = train_model(df, "random_forest")
    best = "random_forest" if rf_result["accuracy"] >= dt_result["accuracy"] else "decision_tree"
    return {
        "decision_tree": dt_result,
        "random_forest": rf_result,
        "best_model": best,
    }


def load_model(algorithm: str = "random_forest"):
    model_path = os.path.join(MODEL_DIR, f"{algorithm}.pkl")
    encoder_path = os.path.join(MODEL_DIR, f"{algorithm}_encoders.pkl")
    target_enc_path = os.path.join(MODEL_DIR, f"{algorithm}_target_enc.pkl")

    if not all(os.path.exists(p) for p in [model_path, encoder_path, target_enc_path]):
        return None, None, None

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(encoder_path, "rb") as f:
        encoders = pickle.load(f)
    with open(target_enc_path, "rb") as f:
        target_encoder = pickle.load(f)

    return model, encoders, target_encoder


def is_trained(algorithm: str = "random_forest") -> bool:
    model_path = os.path.join(MODEL_DIR, f"{algorithm}.pkl")
    return os.path.exists(model_path)
