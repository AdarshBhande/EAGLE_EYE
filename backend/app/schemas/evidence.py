from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .observed_model import BoundingBox
from .qc import QCStatus

class EvidenceType(str, Enum):
    ANNOTATED_IMAGE = "ANNOTATED_IMAGE"
    DEFECT_CROP = "DEFECT_CROP"
    EVIDENCE_CARD = "EVIDENCE_CARD"
    COMPARISON_CARD = "COMPARISON_CARD"

class EvidenceReference(BaseModel):
    file_name: str = Field(..., description="File basename inside storage")
    relative_path: str = Field(..., description="Relative storage path")
    url: str = Field(..., description="API endpoint URL to retrieve the image asset")
    mime_type: str = Field(default="image/jpeg", description="MIME content type")
    width: Optional[int] = Field(None, description="Image width in pixels")
    height: Optional[int] = Field(None, description="Image height in pixels")

class EvidenceItem(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence tracking identifier")
    issue_id: str = Field(..., description="Associated QC issue ID")
    inspection_id: str = Field(..., description="Associated inspection ID")
    rule_id: str = Field(..., description="Associated QC rule ID")
    issue_status: QCStatus = Field(..., description="Issue severity: FAIL or REVIEW")
    evidence_type: EvidenceType = Field(..., description="Primary evidence category")
    source_image_filename: str = Field(..., description="Original source photograph filename")
    bounding_box: Optional[BoundingBox] = Field(None, description="Observed or expected region bounding box")
    crop_reference: Optional[EvidenceReference] = Field(None, description="Zoomed defect crop asset reference")
    annotated_image_reference: Optional[EvidenceReference] = Field(None, description="Full annotated image asset reference")
    expected_value: str = Field(..., description="Structured expected specification")
    found_value: str = Field(..., description="Structured observed result")
    explanation: str = Field(..., description="Auditable text explanation of defect or ambiguity")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional context and metadata")

class EvidenceCollection(BaseModel):
    inspection_id: str = Field(..., description="Associated inspection ID")
    annotated_full_image: Optional[EvidenceReference] = Field(None, description="Master annotated cabinet image reference")
    evidence_items: List[EvidenceItem] = Field(default_factory=list, description="List of generated evidence items")
    generated_at: str = Field(..., description="ISO timestamp of evidence generation")
