import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from ...schemas.observed_model import ObservedCabinetModel
from ...services.observed_model_service import ObservedModelService

router = APIRouter(prefix="/vision", tags=["Computer Vision Observation"])

@router.post(
    "/inspect-image",
    response_model=ObservedCabinetModel,
    summary="Inspect Cabinet Photograph",
    description="Processes cabinet photograph to extract observed components, OCR tags, spatial positions, and image quality metrics. Does NOT perform PASS/FAIL comparison."
)
async def inspect_cabinet_image(
    image: UploadFile = File(...)
):
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Must be a JPG or PNG photograph."
        )

    contents = await image.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty."
        )

    try:
        service = ObservedModelService()
        observed_model = service.inspect_image(image_source=contents)
        return observed_model
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inspecting cabinet image: {str(e)}"
        )
