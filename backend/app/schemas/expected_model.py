from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SourceReference(BaseModel):
    file: str = Field(..., description="Source filename")
    type: str = Field(..., description="Source type: GA or EXCEL")
    page: Optional[int] = Field(None, description="Page number if PDF")
    sheet: Optional[str] = Field(None, description="Sheet name if Excel")
    row: Optional[int] = Field(None, description="Row number if Excel")
    reference_detail: Optional[str] = Field(None, description="Additional reference location detail")

class DrawingPosition(BaseModel):
    page: int = Field(..., description="1-indexed page number in drawing")
    x_min: float = Field(..., description="Minimum X coordinate in PDF points")
    y_min: float = Field(..., description="Minimum Y coordinate in PDF points")
    x_max: float = Field(..., description="Maximum X coordinate in PDF points")
    y_max: float = Field(..., description="Maximum Y coordinate in PDF points")
    unit: str = Field(default="pdf_points", description="Coordinate unit")

class ExpectedComponent(BaseModel):
    tag: str = Field(..., description="Canonical engineering tag (e.g., PS12, CB43)")
    raw_tag: str = Field(..., description="Original un-normalized tag text")
    component_type: str = Field(default="UNKNOWN", description="Component type category (e.g., POWER_SUPPLY, BREAKER, TERMINAL)")
    description: Optional[str] = Field(None, description="Component description")
    expected_order: Optional[int] = Field(None, description="Expected relative layout order index")
    expected_label: Optional[str] = Field(None, description="Expected component label text")
    drawing_position: Optional[DrawingPosition] = Field(None, description="Position in GA drawing")
    source: SourceReference = Field(..., description="Source reference traceability")
    raw_metadata: Dict[str, Any] = Field(default_factory=dict, description="Raw extracted properties")

class ExpectedWire(BaseModel):
    wire_id: str = Field(..., description="Wire identifier")
    source_component: str = Field(..., description="Origin component/terminal tag")
    destination_component: str = Field(..., description="Destination component/terminal tag")
    colour: Optional[str] = Field(None, description="Wire insulation colour")
    label: Optional[str] = Field(None, description="Expected wire label tag")
    ferrule: Optional[str] = Field(None, description="Expected ferrule tag")
    terminal: Optional[str] = Field(None, description="Terminal block tag")
    source: SourceReference = Field(..., description="Source reference traceability")

class ExpectedLabel(BaseModel):
    label_id: str = Field(..., description="Unique label tracking identifier")
    text: str = Field(..., description="Expected label text")
    raw_text: str = Field(..., description="Raw label text before normalization")
    component_tag: Optional[str] = Field(None, description="Associated component tag")
    source: SourceReference = Field(..., description="Source reference traceability")

class ExpectedFerrule(BaseModel):
    ferrule_id: str = Field(..., description="Unique ferrule tracking identifier")
    text: str = Field(..., description="Expected ferrule text code")
    wire_id: Optional[str] = Field(None, description="Associated wire ID")
    terminal_tag: Optional[str] = Field(None, description="Associated terminal tag")
    source: SourceReference = Field(..., description="Source reference traceability")

class ValidationIssue(BaseModel):
    severity: str = Field(..., description="Severity level: ERROR, WARNING, CONFLICT")
    code: str = Field(..., description="Validation error code")
    message: str = Field(..., description="Human-readable explanation of issue")
    component_tag: Optional[str] = Field(None, description="Related component tag if applicable")
    wire_id: Optional[str] = Field(None, description="Related wire ID if applicable")
    source: Optional[SourceReference] = Field(None, description="Source reference")

class ValidationReport(BaseModel):
    status: str = Field(default="VALID", description="Overall status: VALID, WARNING, CONFLICT, INCOMPLETE")
    errors: List[ValidationIssue] = Field(default_factory=list)
    warnings: List[ValidationIssue] = Field(default_factory=list)
    conflicts: List[ValidationIssue] = Field(default_factory=list)

class ExpectedCabinetModel(BaseModel):
    cabinet_id: str = Field(default="CABINET-DEFAULT", description="Project / Cabinet identifier")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="General project metadata")
    components: List[ExpectedComponent] = Field(default_factory=list, description="List of expected components")
    wires: List[ExpectedWire] = Field(default_factory=list, description="List of expected wires")
    labels: List[ExpectedLabel] = Field(default_factory=list, description="List of expected labels")
    ferrules: List[ExpectedFerrule] = Field(default_factory=list, description="List of expected ferrules")
    validation: ValidationReport = Field(default_factory=ValidationReport, description="Validation summary")
    sources: List[SourceReference] = Field(default_factory=list, description="List of ingested source files")
