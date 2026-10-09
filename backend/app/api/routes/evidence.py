import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import json

from ...core.config import settings
from ...schemas.qc import InspectionResult
from ...schemas.observed_model import ObservedCabinetModel
from ...schemas.evidence import EvidenceCollection, EvidenceItem
from ...services.evidence_service import EvidenceService

router = APIRouter(prefix="/evidence", tags=["Evidence & Visual Proof System"])

# In-memory store for generated evidence collections (will be persisted to DB in Phase 6)
_EVIDENCE_STORE: dict[str, EvidenceCollection] = {}
_EVIDENCE_ITEM_STORE: dict[str, EvidenceItem] = {}

class GenerateEvidenceJSONRequest(BaseModel):
    inspection_result: InspectionResult
    observed_model: ObservedCabinetModel
    image_filename: Optional[str] = Field(None, description="Optional path to existing uploaded image in storage or data/sample")

@router.post(
    "/generate",
    response_model=EvidenceCollection,
    summary="Generate Visual Evidence & Defect Crops",
    description="Processes InspectionResult and source cabinet photograph to generate annotated master image, defect crops, and structured EvidenceItems for all FAIL and REVIEW issues."
)
async def generate_evidence_endpoint(
    request_data: str = Form(..., description="JSON string of GenerateEvidenceJSONRequest"),
    image_file: Optional[UploadFile] = File(None, description="Cabinet photograph file upload")
) -> EvidenceCollection:
    try:
        data_dict = json.loads(request_data)
        inspection_result = InspectionResult(**data_dict["inspection_result"])
        observed_model = ObservedCabinetModel(**data_dict["observed_model"])
        image_filename = data_dict.get("image_filename")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request payload JSON: {str(e)}"
        )

    image_bytes = None
    if image_file:
        image_bytes = await image_file.read()

    # Determine image path fallback if file not uploaded directly
    image_path = None
    if not image_bytes and image_filename:
        # Check storage or data/sample
        candidate_paths = [
            Path(settings.STORAGE_DIR) / image_filename,
            Path("data/sample") / image_filename,
            Path(image_filename)
        ]
        for p in candidate_paths:
            if p.exists() and p.is_file():
                image_path = str(p.resolve())
                break

    try:
        service = EvidenceService()
        collection = service.generate_evidence_for_inspection(
            inspection_result=inspection_result,
            observed_model=observed_model,
            image_bytes=image_bytes,
            image_path=image_path
        )

        # Store in registry
        _EVIDENCE_STORE[collection.inspection_id] = collection
        for item in collection.evidence_items:
            _EVIDENCE_ITEM_STORE[item.evidence_id] = item
            _EVIDENCE_ITEM_STORE[item.issue_id] = item # Also index by issue_id

        return collection

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating visual evidence: {str(e)}"
        )

@router.get(
    "/{evidence_id}",
    response_model=EvidenceItem,
    summary="Retrieve Evidence Item Details",
    description="Returns metadata, crops, and explanations for a specific evidence tracking ID."
)
def get_evidence_by_id(evidence_id: str) -> EvidenceItem:
    item = _EVIDENCE_ITEM_STORE.get(evidence_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence item '{evidence_id}' not found."
        )
    return item

@router.get(
    "/issue/{issue_id}",
    response_model=EvidenceItem,
    summary="Retrieve Evidence Item by Issue ID",
    description="Returns the visual evidence associated with a specific QC issue ID."
)
def get_evidence_by_issue_id(issue_id: str) -> EvidenceItem:
    item = _EVIDENCE_ITEM_STORE.get(issue_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No visual evidence found for issue '{issue_id}'."
        )
    return item

@router.get(
    "/file/{category}/{filename}",
    summary="Retrieve Evidence Image Asset",
    description="Serves annotated master images, defect crops, and evidence cards with strict path traversal security checks."
)
def get_evidence_file(category: str, filename: str):
    """
    Serves stored evidence image file with path traversal defense.
    Categories allowed: 'annotated', 'crops', 'cards'.
    """
    if category not in ["annotated", "crops", "cards"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid evidence category. Must be 'annotated', 'crops', or 'cards'."
        )

    # Sanitize filename against directory traversal
    safe_filename = Path(filename).name
    base_dir = Path(settings.STORAGE_DIR).resolve() / "evidence" / category
    file_path = (base_dir / safe_filename).resolve()

    # Security check: Ensure target path remains strictly within base_dir
    try:
        file_path.relative_to(base_dir)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid file path."
        )

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence file '{safe_filename}' not found."
        )

    return FileResponse(path=file_path, media_type="image/jpeg")
