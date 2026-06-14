from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base


class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(Integer, primary_key=True, index=True)
    applicant_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    family_income = Column(Float, nullable=False)
    family_members = Column(Integer, nullable=False)
    employment_status = Column(String, nullable=False)
    education_level = Column(String, nullable=False)
    disability_status = Column(String, nullable=False)
    eligibility_status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
