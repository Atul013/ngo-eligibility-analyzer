from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime

EMPLOYMENT_STATUSES = ["Unemployed", "Part-time", "Self-employed", "Employed"]
EDUCATION_LEVELS = [
    "No Formal Education", "Primary", "Secondary", "Undergraduate", "Postgraduate"
]
DISABILITY_VALUES = ["Yes", "No"]
ELIGIBILITY_VALUES = ["Eligible", "Not Eligible"]


class BeneficiaryBase(BaseModel):
    applicant_name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=5, le=100)
    family_income: float = Field(..., ge=0)
    family_members: int = Field(..., ge=1, le=20)
    employment_status: str
    education_level: str
    disability_status: str
    eligibility_status: str

    @field_validator("employment_status")
    @classmethod
    def validate_employment(cls, v):
        if v not in EMPLOYMENT_STATUSES:
            raise ValueError(f"Must be one of {EMPLOYMENT_STATUSES}")
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education(cls, v):
        if v not in EDUCATION_LEVELS:
            raise ValueError(f"Must be one of {EDUCATION_LEVELS}")
        return v

    @field_validator("disability_status")
    @classmethod
    def validate_disability(cls, v):
        if v not in DISABILITY_VALUES:
            raise ValueError(f"Must be one of {DISABILITY_VALUES}")
        return v

    @field_validator("eligibility_status")
    @classmethod
    def validate_eligibility(cls, v):
        if v not in ELIGIBILITY_VALUES:
            raise ValueError(f"Must be one of {ELIGIBILITY_VALUES}")
        return v


class BeneficiaryCreate(BeneficiaryBase):
    pass


class BeneficiaryUpdate(BaseModel):
    applicant_name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=5, le=100)
    family_income: Optional[float] = Field(None, ge=0)
    family_members: Optional[int] = Field(None, ge=1, le=20)
    employment_status: Optional[str] = None
    education_level: Optional[str] = None
    disability_status: Optional[str] = None
    eligibility_status: Optional[str] = None

    @field_validator("employment_status")
    @classmethod
    def validate_employment(cls, v):
        if v is not None and v not in EMPLOYMENT_STATUSES:
            raise ValueError(f"Must be one of {EMPLOYMENT_STATUSES}")
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education(cls, v):
        if v is not None and v not in EDUCATION_LEVELS:
            raise ValueError(f"Must be one of {EDUCATION_LEVELS}")
        return v

    @field_validator("disability_status")
    @classmethod
    def validate_disability(cls, v):
        if v is not None and v not in DISABILITY_VALUES:
            raise ValueError(f"Must be one of {DISABILITY_VALUES}")
        return v

    @field_validator("eligibility_status")
    @classmethod
    def validate_eligibility(cls, v):
        if v is not None and v not in ELIGIBILITY_VALUES:
            raise ValueError(f"Must be one of {ELIGIBILITY_VALUES}")
        return v


class BeneficiaryResponse(BeneficiaryBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PredictRequest(BaseModel):
    age: int = Field(..., ge=5, le=100)
    family_income: float = Field(..., ge=0)
    family_members: int = Field(..., ge=1, le=20)
    employment_status: str
    education_level: str
    disability_status: str
    algorithm: Literal["decision_tree", "random_forest"] = "random_forest"

    @field_validator("employment_status")
    @classmethod
    def validate_employment(cls, v):
        if v not in EMPLOYMENT_STATUSES:
            raise ValueError(f"Must be one of {EMPLOYMENT_STATUSES}")
        return v

    @field_validator("education_level")
    @classmethod
    def validate_education(cls, v):
        if v not in EDUCATION_LEVELS:
            raise ValueError(f"Must be one of {EDUCATION_LEVELS}")
        return v

    @field_validator("disability_status")
    @classmethod
    def validate_disability(cls, v):
        if v not in DISABILITY_VALUES:
            raise ValueError(f"Must be one of {DISABILITY_VALUES}")
        return v


class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    algorithm_used: str


class TrainRequest(BaseModel):
    algorithm: Literal["decision_tree", "random_forest", "both"] = "both"


class AnalyticsResponse(BaseModel):
    total_applicants: int
    eligible_count: int
    not_eligible_count: int
    average_income: float
    average_age: float
    average_family_members: float
    employment_breakdown: dict
    education_breakdown: dict
    disability_breakdown: dict
