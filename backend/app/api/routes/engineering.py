import os
import shutil
import tempfile
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from ...schemas.expected_model import ExpectedCabinetModel
from ...services.expected_model_service import ExpectedModelService

router = APIRouter(prefix="/engineering", tags=["Engineering Reference"])

@router.post(
    "/parse",
    response_model=ExpectedCabinetModel,
    summary="Parse Engineering Reference Files",
    description="Accepts GA Drawing PDF and Excel Wire/Label list files, returning the normalized Expected Cabinet Model."
)
async def parse_engineering_references(
    cabinet_id: str = Form(default="CABINET-PROJECT-01"),
    ga_file: Optional[UploadFile] = File(None),
    excel_file: Optional[UploadFile] = File(None)
):
    if not ga_file and not excel_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one engineering reference file (GA PDF or Excel) must be uploaded."
        )

    temp_dir = tempfile.mkdtemp(prefix="eagle_eye_parse_")
    ga_path = None
    excel_path = None

    try:
        if ga_file:
            if not ga_file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="GA file must be a PDF (.pdf).")
            ga_path = os.path.join(temp_dir, ga_file.filename)
            with open(ga_path, "wb") as buffer:
                shutil.copyfileobj(ga_file.file, buffer)

        if excel_file:
            if not (excel_file.filename.lower().endswith(".xlsx") or excel_file.filename.lower().endswith(".xls")):
                raise HTTPException(status_code=400, detail="Wire list file must be an Excel spreadsheet (.xlsx or .xls).")
            excel_path = os.path.join(temp_dir, excel_file.filename)
            with open(excel_path, "wb") as buffer:
                shutil.copyfileobj(excel_file.file, buffer)

        service = ExpectedModelService(cabinet_id=cabinet_id)
        expected_model = service.build_expected_model(
            ga_pdf_path=ga_path,
            excel_path=excel_path
        )
        return expected_model

    finally:
        # Cleanup temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)
