import hashlib
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .qc import QCStatus, QCIssue
from .expected_model import ExpectedCabinetModel
from .observed_model import ObservedCabinetModel, BoundingBox
from .evidence import EvidenceReference

class LifecycleState(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    STILL_OPEN = "STILL_OPEN"
    NEW = "NEW"

def compute_issue_fingerprint(
    rule_id: str,
    category: str,
    expected_value: Optional[str],
    found_value: Optional[str] = None
) -> str:
    """
    Computes a deterministic, stable issue fingerprint string derived ONLY from normalized fields.
    Extracts component tag if present in expected_value (e.g., "Component 'CB43'" -> "CB43").
    For extra components, anchors on found_value (e.g., "CB99").
    Does NOT use random values or timestamps.
    """
    r_clean = (rule_id or "").upper().strip()
    cat_clean = (category or "").upper().strip()
    exp_clean = (expected_value or "").upper().strip()
    found_clean = (found_value or "").upper().strip()

    if cat_clean == "EXTRA_COMPONENT":
        raw = f"{r_clean}:{cat_clean}:{found_clean}"
    else:
        target_key = exp_clean
        if "'" in exp_clean:
            parts = exp_clean.split("'")
            if len(parts) >= 2:
                target_key = parts[1]
        raw = f"{r_clean}:{target_key}"

    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]



class PersistedIssue(BaseModel):
    issue_id: str = Field(..., description="Unique issue tracking ID")
    inspection_id: str = Field(..., description="Parent inspection ID")
    rule_id: str = Field(..., description="Associated QC rule ID")
    category: str = Field(..., description="Issue category (e.g. MISSING_COMPONENT, ORDER_MISMATCH)")
    expected_value: Optional[str] = Field(None, description="Expected specification")
    found_value: Optional[str] = Field(None, description="Found observation")
    reason: str = Field(..., description="Detailed issue description")
    status: QCStatus = Field(..., description="Issue status: FAIL or REVIEW")
    lifecycle_state: LifecycleState = Field(default=LifecycleState.OPEN, description="Lifecycle state: OPEN, RESOLVED, STILL_OPEN, NEW")
    fingerprint: str = Field(..., description="Deterministic fingerprint")
    bounding_box: Optional[BoundingBox] = Field(None, description="Bounding box if available")
    evidence_reference: Optional[EvidenceReference] = Field(None, description="Linked evidence asset reference")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")

class PersistedInspection(BaseModel):
    inspection_id: str = Field(..., description="Unique inspection ID")
    cabinet_id: str = Field(..., description="Cabinet identifier")
    timestamp: str = Field(..., description="Inspection timestamp")
    overall_status: QCStatus = Field(..., description="Overall status: PASS, FAIL, REVIEW")
    summary: Dict[str, Any] = Field(..., description="Check & issue counters")
    expected_model: ExpectedCabinetModel = Field(..., description="Ingested expected model")
    observed_model: ObservedCabinetModel = Field(..., description="Ingested observed model")
    issues: List[PersistedIssue] = Field(default_factory=list, description="Persisted issues")

class RecheckSummary(BaseModel):
    previous_failures: int = Field(..., description="Count of failures in previous inspection")
    resolved: int = Field(..., description="Count of issues resolved in re-check")
    still_open: int = Field(..., description="Count of issues still open in re-check")
    new: int = Field(..., description="Count of new issues introduced in re-check")
    final_status: QCStatus = Field(..., description="Final overall re-check status: PASS, FAIL, REVIEW")

class RecheckResult(BaseModel):
    comparison_id: str = Field(..., description="Unique comparison tracking ID")
    previous_inspection_id: str = Field(..., description="Previous inspection ID")
    current_inspection_id: str = Field(..., description="Current re-check inspection ID")
    summary: RecheckSummary = Field(..., description="Re-check summary metrics")
    resolved_issues: List[PersistedIssue] = Field(default_factory=list, description="Issues resolved in re-check")
    still_open_issues: List[PersistedIssue] = Field(default_factory=list, description="Issues still open after re-check")
    new_issues: List[PersistedIssue] = Field(default_factory=list, description="New issues appearing in re-check")
    created_at: str = Field(..., description="ISO 8601 timestamp")
