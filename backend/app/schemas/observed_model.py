from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x1: float = Field(..., description="Top-left X coordinate in pixels")
    y1: float = Field(..., description="Top-left Y coordinate in pixels")
    x2: float = Field(..., description="Bottom-right X coordinate in pixels")
    y2: float = Field(..., description="Bottom-right Y coordinate in pixels")

    @property
    def width(self) -> float:
        return max(0.0, self.x2 - self.x1)

    @property
    def height(self) -> float:
        return max(0.0, self.y2 - self.y1)

    @property
    def center_x(self) -> float:
        return (self.x1 + self.x2) / 2.0

    @property
    def center_y(self) -> float:
        return (self.y1 + self.y2) / 2.0

class ImageMetadata(BaseModel):
    filename: str = Field(..., description="Source image filename")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    aspect_ratio: float = Field(..., description="Image width / height ratio")
    brightness: float = Field(..., description="Mean image brightness [0-255]")
    sharpness: float = Field(..., description="Laplacian variance sharpness metric")
    quality_status: str = Field(..., description="Quality status: SUITABLE, WARNING, UNSUITABLE")
    quality_reasons: List[str] = Field(default_factory=list, description="Explanations for quality warnings or unsuitability")

class ObservedComponent(BaseModel):
    detection_id: str = Field(..., description="Unique detection identifier (e.g. DET-001)")
    component_type: str = Field(..., description="Detected component category (e.g., POWER_SUPPLY, BREAKER, TERMINAL)")
    raw_tag: Optional[str] = Field(None, description="Raw OCR tag text if readable")
    tag: Optional[str] = Field(None, description="Normalized engineering tag if readable")
    confidence: float = Field(..., description="Detection confidence score [0.0 - 1.0]")
    bounding_box: BoundingBox = Field(..., description="Pixel bounding box in original image")
    center_x: float = Field(..., description="Normalized center X coordinate [0.0 - 1.0]")
    center_y: float = Field(..., description="Normalized center Y coordinate [0.0 - 1.0]")
    row_index: Optional[int] = Field(None, description="Estimated spatial row index")
    col_index: Optional[int] = Field(None, description="Estimated spatial column index")
    crop_path: Optional[str] = Field(None, description="Relative path to cropped evidence image")
    raw_metadata: Dict[str, Any] = Field(default_factory=dict, description="Detector-specific raw metadata")

class ObservedLabel(BaseModel):
    label_id: str = Field(..., description="Unique label observation ID")
    raw_text: str = Field(..., description="Raw OCR text extracted from label region")
    text: str = Field(..., description="Normalized label text")
    confidence: float = Field(..., description="OCR confidence score [0.0 - 1.0]")
    bounding_box: BoundingBox = Field(..., description="Bounding box of label region")
    associated_component_id: Optional[str] = Field(None, description="ID of nearest detected component")

class ObservedFerruleCandidate(BaseModel):
    ferrule_id: str = Field(..., description="Unique ferrule candidate ID")
    raw_text: Optional[str] = Field(None, description="Raw OCR text if readable")
    text: Optional[str] = Field(None, description="Normalized ferrule code if readable")
    confidence: float = Field(..., description="Observation confidence score")
    bounding_box: BoundingBox = Field(..., description="Ferrule region bounding box")
    terminal_tag: Optional[str] = Field(None, description="Associated terminal block tag if detected")

class ObservedCabinetModel(BaseModel):
    observation_id: str = Field(..., description="Unique observation session ID")
    image_metadata: ImageMetadata = Field(..., description="Processed image dimensions and quality assessment")
    detected_components: List[ObservedComponent] = Field(default_factory=list, description="Observed components")
    detected_labels: List[ObservedLabel] = Field(default_factory=list, description="Observed text labels")
    detected_ferrules: List[ObservedFerruleCandidate] = Field(default_factory=list, description="Observed ferrule candidates")
    detector_info: Dict[str, Any] = Field(default_factory=dict, description="Metadata regarding detector & model weights used")
