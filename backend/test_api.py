import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import get_db, Base
from models import Beneficiary

TEST_DB_URL = "sqlite:///./test_beneficiaries.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_payload():
    return {
        "applicant_name": "Ravi Kumar",
        "age": 25,
        "family_income": 120000,
        "family_members": 5,
        "employment_status": "Unemployed",
        "education_level": "Secondary",
        "disability_status": "No",
        "eligibility_status": "Eligible",
    }


# ── CRUD Tests ──────────────────────────────────────────────────────────────

class TestCreate:
    def test_create_beneficiary(self, client, sample_payload):
        res = client.post("/beneficiaries", json=sample_payload)
        assert res.status_code == 201
        data = res.json()
        assert data["applicant_name"] == "Ravi Kumar"
        assert data["id"] is not None

    def test_create_invalid_employment(self, client, sample_payload):
        sample_payload["employment_status"] = "InvalidStatus"
        res = client.post("/beneficiaries", json=sample_payload)
        assert res.status_code == 422

    def test_create_invalid_education(self, client, sample_payload):
        sample_payload["education_level"] = "PhD"  # not in valid list
        res = client.post("/beneficiaries", json=sample_payload)
        assert res.status_code == 422

    def test_create_negative_income(self, client, sample_payload):
        sample_payload["family_income"] = -1
        res = client.post("/beneficiaries", json=sample_payload)
        assert res.status_code == 422

    def test_create_age_out_of_range(self, client, sample_payload):
        sample_payload["age"] = 200
        res = client.post("/beneficiaries", json=sample_payload)
        assert res.status_code == 422


class TestRead:
    def test_list_empty(self, client):
        res = client.get("/beneficiaries")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_after_create(self, client, sample_payload):
        client.post("/beneficiaries", json=sample_payload)
        res = client.get("/beneficiaries")
        assert len(res.json()) == 1

    def test_get_by_id(self, client, sample_payload):
        created = client.post("/beneficiaries", json=sample_payload).json()
        res = client.get(f"/beneficiaries/{created['id']}")
        assert res.status_code == 200
        assert res.json()["applicant_name"] == "Ravi Kumar"

    def test_get_nonexistent(self, client):
        res = client.get("/beneficiaries/9999")
        assert res.status_code == 404

    def test_search_by_name(self, client, sample_payload):
        client.post("/beneficiaries", json=sample_payload)
        res = client.get("/beneficiaries?search=Ravi")
        assert len(res.json()) == 1

    def test_filter_by_eligibility(self, client, sample_payload):
        client.post("/beneficiaries", json=sample_payload)
        not_eligible = {**sample_payload, "applicant_name": "Priya", "eligibility_status": "Not Eligible"}
        client.post("/beneficiaries", json=not_eligible)
        res = client.get("/beneficiaries?eligibility=Eligible")
        assert all(r["eligibility_status"] == "Eligible" for r in res.json())


class TestUpdate:
    def test_update_beneficiary(self, client, sample_payload):
        created = client.post("/beneficiaries", json=sample_payload).json()
        res = client.put(f"/beneficiaries/{created['id']}", json={"age": 30})
        assert res.status_code == 200
        assert res.json()["age"] == 30

    def test_update_nonexistent(self, client):
        res = client.put("/beneficiaries/9999", json={"age": 30})
        assert res.status_code == 404

    def test_partial_update(self, client, sample_payload):
        created = client.post("/beneficiaries", json=sample_payload).json()
        res = client.put(f"/beneficiaries/{created['id']}", json={"employment_status": "Employed"})
        assert res.status_code == 200
        assert res.json()["employment_status"] == "Employed"
        assert res.json()["applicant_name"] == "Ravi Kumar"


class TestDelete:
    def test_delete_beneficiary(self, client, sample_payload):
        created = client.post("/beneficiaries", json=sample_payload).json()
        res = client.delete(f"/beneficiaries/{created['id']}")
        assert res.status_code == 204
        assert client.get(f"/beneficiaries/{created['id']}").status_code == 404

    def test_delete_nonexistent(self, client):
        res = client.delete("/beneficiaries/9999")
        assert res.status_code == 404


# ── ML Tests ────────────────────────────────────────────────────────────────

def _seed(client, sample_payload, n: int = 30):
    statuses = ["Unemployed", "Part-time", "Self-employed", "Employed"]
    educations = ["No Formal Education", "Primary", "Secondary", "Undergraduate", "Postgraduate"]
    disabilities = ["Yes", "No"]
    for i in range(n):
        payload = {
            **sample_payload,
            "applicant_name": f"Person {i}",
            "age": 20 + (i % 40),
            "family_income": 80000 + i * 5000,
            "family_members": 1 + (i % 8),
            "employment_status": statuses[i % 4],
            "education_level": educations[i % 5],
            "disability_status": disabilities[i % 2],
            "eligibility_status": "Eligible" if i % 2 == 0 else "Not Eligible",
        }
        client.post("/beneficiaries", json=payload)


class TestML:
    def test_train_requires_data(self, client):
        res = client.post("/train", json={"algorithm": "random_forest"})
        assert res.status_code == 400

    def test_train_decision_tree(self, client, sample_payload):
        _seed(client, sample_payload)
        res = client.post("/train", json={"algorithm": "decision_tree"})
        assert res.status_code == 200
        data = res.json()
        assert "accuracy" in data
        assert 0 <= data["accuracy"] <= 1

    def test_train_random_forest(self, client, sample_payload):
        _seed(client, sample_payload)
        res = client.post("/train", json={"algorithm": "random_forest"})
        assert res.status_code == 200
        data = res.json()
        assert "precision" in data
        assert "recall" in data
        assert "confusion_matrix" in data

    def test_train_both(self, client, sample_payload):
        _seed(client, sample_payload)
        res = client.post("/train", json={"algorithm": "both"})
        assert res.status_code == 200
        data = res.json()
        assert "decision_tree" in data
        assert "random_forest" in data
        assert "best_model" in data

    def test_predict_without_training(self, client):
        import os, glob
        for f in glob.glob("models/*.pkl"):
            os.remove(f)
        res = client.post("/predict", json={
            "age": 25, "family_income": 120000, "family_members": 4,
            "employment_status": "Unemployed", "education_level": "Secondary",
            "disability_status": "No", "algorithm": "random_forest",
        })
        assert res.status_code == 400

    def test_predict_after_training(self, client, sample_payload):
        _seed(client, sample_payload)
        client.post("/train", json={"algorithm": "random_forest"})
        res = client.post("/predict", json={
            "age": 22, "family_income": 90000, "family_members": 5,
            "employment_status": "Unemployed", "education_level": "Primary",
            "disability_status": "Yes", "algorithm": "random_forest",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["prediction"] in ["Eligible", "Not Eligible"]
        assert 0 <= data["confidence"] <= 1

    def test_predict_invalid_field(self, client, sample_payload):
        _seed(client, sample_payload)
        client.post("/train", json={"algorithm": "random_forest"})
        res = client.post("/predict", json={
            "age": 25, "family_income": 100000, "family_members": 3,
            "employment_status": "INVALID", "education_level": "Secondary",
            "disability_status": "No", "algorithm": "random_forest",
        })
        assert res.status_code == 422


# ── Analytics Tests ─────────────────────────────────────────────────────────

class TestAnalytics:
    def test_analytics_no_data(self, client):
        res = client.get("/analytics")
        assert res.status_code == 404

    def test_analytics_with_data(self, client, sample_payload):
        _seed(client, sample_payload, n=10)
        res = client.get("/analytics")
        assert res.status_code == 200
        data = res.json()
        assert data["total_applicants"] == 10
        assert "employment_breakdown" in data
        assert "education_breakdown" in data

    def test_health(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
