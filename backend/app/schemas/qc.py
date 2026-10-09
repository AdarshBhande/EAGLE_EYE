from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .expected_model import SourceReference
from .observed_model import BoundingBox

class QCStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"

class MatchStatus(str, Enum):
    MATCHED = "MATCHED"
    UNMATCHED = "UNMATCHED"
    AMBIGUOUS = "AMBIGUOUS"

class MatchResult(BaseModel):
    expected_tag: Optional[str] = Field(None, description="Expected component tag if matched")
    observed_detection_id: Optional[str] = Field(None, description="Observed component detection ID if matched")
    observed_tag: Optional[str] = Field(None, description="Observed component tag text if available")
    observed_type: Optional[str] = Field(None, description="Observed component type if available")
    confidence: float = Field(..., description="Calculated matching confidence [0.0 - 1.0]")
    status: MatchStatus = Field(..., description="Matching status: MATCHED, UNMATCHED, AMBIGUOUS")
    signals: Dict[str, Any] = Field(default_factory=dict, description="Detailed matching signals (tag_match, type_match, spatial_match, etc.)")
    reasoning: str = Field(..., description="Explainable rationale for match decision")

class QCCheck(BaseModel):
    check_id: str = Field(..., description="Unique check execution identifier")
    rule_id: str = Field(..., description="Rule identifier (e.g. RULE-PRESENCE-001)")
    rule_name: str = Field(..., description="Human-readable rule name")
    status: QCStatus = Field(..., description="QC evaluation status: PASS, FAIL, REVIEW")
    expected_tag: Optional[str] = Field(None, description="Related expected component tag")
    observed_detection_id: Optional[str] = Field(None, description="Related observed detection ID")
    message: str = Field(..., description="Clear explanation of check result")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured check details")
    evidence_reference: Optional[Dict[str, Any]] = Field(None, description="Reference data for visual evidence generation")

class QCIssue(BaseModel):
    issue_id: str = Field(..., description="Stable deterministic issue identifier")
    status: QCStatus = Field(..., description="Issue severity: FAIL or REVIEW")
    category: str = Field(..., description="Issue category (e.g. MISSING_COMPONENT, ORDER_MISMATCH, LABEL_MISMATCH, FERRULE_MISMATCH)")
    expected: Optional[str] = Field(None, description="Expected state description")
    found: Optional[str] = Field(None, description="Observed state description")
    reason: str = Field(..., description="Detailed explanation of the defect or ambiguity")
    confidence_score: float = Field(..., description="Confidence score associated with this evaluation")
    expected_reference: Optional[SourceReference] = Field(None, description="Source reference in GA/Excel")
    observed_reference: Optional[Dict[str, Any]] = Field(None, description="Source detection and bounding box details")
    rule_id: str = Field(..., description="Identifier of rule that produced this issue")

class InspectionResult(BaseModel):
    inspection_id: str = Field(..., description="Unique inspection execution ID")
    overall_status: QCStatus = Field(..., description="Overall aggregated status: PASS, FAIL, REVIEW")
    summary: Dict[str, int] = Field(default_factory=dict, description="Summary counters: total_checks, pass_count, fail_count, review_count")
    matches: List[MatchResult] = Field(default_factory=list, description="Component matching details")
    checks: List[QCCheck] = Field(default_factory=list, description="All executed rule check results")
    issues: List[QCIssue] = Field(default_factory=list, description="All FAIL or REVIEW issues")
    expected_model_id: str = Field(..., description="Cabinet ID of expected reference model")
    observation_id: str = Field(..., description="Observation ID of visual model")
    timestamp: str = Field(..., description="ISO 8601 execution timestamp")
