import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base

class Inspection(Base):
    """
    Persisted Inspection History record. Immutable once written.
    """
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String(64), unique=True, index=True, nullable=False)
    cabinet_id = Column(String(64), index=True, nullable=False)
    overall_status = Column(String(32), nullable=False) # PASS, FAIL, REVIEW
    summary_json = Column(JSON, nullable=False)
    expected_model_json = Column(JSON, nullable=False)
    observed_model_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    issues = relationship("InspectionIssue", back_populates="inspection", cascade="all, delete-orphan")

class InspectionIssue(Base):
    """
    Persisted Quality Control Issue record.
    """
    __tablename__ = "inspection_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(String(64), index=True, nullable=False)
    inspection_id = Column(String(64), ForeignKey("inspections.inspection_id"), nullable=False, index=True)
    rule_id = Column(String(64), nullable=False)
    category = Column(String(64), nullable=False)
    expected_value = Column(String(255), nullable=True)
    found_value = Column(String(255), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(32), nullable=False) # FAIL, REVIEW
    lifecycle_state = Column(String(32), nullable=False, default="OPEN") # OPEN, RESOLVED, STILL_OPEN, NEW
    fingerprint = Column(String(64), index=True, nullable=False)
    bounding_box_json = Column(JSON, nullable=True)
    evidence_reference_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inspection = relationship("Inspection", back_populates="issues")

class RecheckComparison(Base):
    """
    Persisted Re-check Comparison record comparing a previous inspection against a current recheck inspection.
    """
    __tablename__ = "recheck_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    comparison_id = Column(String(64), unique=True, index=True, nullable=False)
    previous_inspection_id = Column(String(64), ForeignKey("inspections.inspection_id"), nullable=False, index=True)
    current_inspection_id = Column(String(64), ForeignKey("inspections.inspection_id"), nullable=False, index=True)
    summary_json = Column(JSON, nullable=False)
    resolved_issues_json = Column(JSON, nullable=False)
    still_open_issues_json = Column(JSON, nullable=False)
    new_issues_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
