from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...database.session import get_db
from ...schemas.qc import InspectionResult
from ...schemas.expected_model import ExpectedCabinetModel
from ...schemas.observed_model import ObservedCabinetModel
from ...schemas.recheck import PersistedInspection, PersistedIssue, RecheckResult
from ...services.qc_service import QCService
from ...services.evidence_service import EvidenceService
from ...services.recheck_service import RecheckService

router = APIRouter(tags=["Inspection History & Re-check Lifecycle System"])

class PersistInspectionRequest(BaseModel):
    inspection_result: InspectionResult = Field(..., description="QC Inspection result to persist")
    expected_model: ExpectedCabinetModel = Field(..., description="Expected engineering model")
    observed_model: ObservedCabinetModel = Field(..., description="Observed visual model")

class PerformRecheckRequest(BaseModel):
    expected_model: ExpectedCabinetModel = Field(..., description="Expected engineering model")
    observed_model: ObservedCabinetModel = Field(..., description="Observed visual model for re-check")

@router.post(
    "/inspections",
    response_model=PersistedInspection,
    status_code=status.HTTP_201_CREATED,
    summary="Persist Inspection Record",
    description="Stores an inspection result, expected model, observed model, and issues to immutable history."
)
def create_inspection_endpoint(
    request: PersistInspectionRequest,
    db: Session = Depends(get_db)
) -> PersistedInspection:
    try:
        service = RecheckService()
        result = service.persist_inspection(
            inspection_result=request.inspection_result,
            expected_model=request.expected_model,
            observed_model=request.observed_model,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error persisting inspection: {str(e)}"
        )

@router.get(
    "/inspections",
    response_model=List[PersistedInspection],
    summary="List Inspection History",
    description="Returns all persisted inspection history records in reverse chronological order."
)
def list_inspections_endpoint(db: Session = Depends(get_db)) -> List[PersistedInspection]:
    service = RecheckService()
    return service.list_inspections(db=db)

@router.get(
    "/inspections/{inspection_id}",
    response_model=PersistedInspection,
    summary="Get Inspection Details",
    description="Retrieves a specific inspection history record by inspection_id."
)
def get_inspection_endpoint(inspection_id: str, db: Session = Depends(get_db)) -> PersistedInspection:
    service = RecheckService()
    try:
        return service.get_inspection(inspection_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get(
    "/inspections/{inspection_id}/issues",
    response_model=List[PersistedIssue],
    summary="Get Issues for Inspection",
    description="Retrieves persisted issues for a given inspection ID."
)
def get_inspection_issues_endpoint(inspection_id: str, db: Session = Depends(get_db)) -> List[PersistedIssue]:
    service = RecheckService()
    try:
        inspection = service.get_inspection(inspection_id, db=db)
        return inspection.issues
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post(
    "/inspections/{previous_inspection_id}/recheck",
    response_model=RecheckResult,
    summary="Perform Re-check after Corrections",
    description="Runs QC evaluation on a new re-check observation and compares it against a selected previous inspection. Identifies RESOLVED, STILL_OPEN, and NEW issues."
)
def perform_recheck_endpoint(
    previous_inspection_id: str,
    request: PerformRecheckRequest,
    db: Session = Depends(get_db)
) -> RecheckResult:
    service = RecheckService()
    
    # Verify previous inspection exists
    try:
        service.get_inspection(previous_inspection_id, db=db)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Previous inspection '{previous_inspection_id}' not found."
        )

    try:
        # Step 1: Run QC Decision Engine on recheck observation
        qc_service = QCService()
        curr_qc_result = qc_service.evaluate_cabinet(
            expected_model=request.expected_model,
            observed_model=request.observed_model
        )

        # Step 2: Generate visual evidence
        evidence_service = EvidenceService()
        curr_evidence = evidence_service.generate_evidence_for_inspection(
            inspection_result=curr_qc_result,
            observed_model=request.observed_model
        )

        # Step 3: Execute recheck comparison against previous inspection
        recheck_result = service.perform_recheck(
            previous_inspection_id=previous_inspection_id,
            current_inspection_result=curr_qc_result,
            current_expected_model=request.expected_model,
            current_observed_model=request.observed_model,
            current_evidence=curr_evidence,
            db=db
        )

        return recheck_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing re-check: {str(e)}"
        )

@router.get(
    "/rechecks/{comparison_id}",
    response_model=RecheckResult,
    summary="Get Re-check Comparison Details",
    description="Retrieves a stored re-check comparison result by comparison_id."
)
def get_recheck_comparison_endpoint(comparison_id: str, db: Session = Depends(get_db)) -> RecheckResult:
    service = RecheckService()
    try:
        return service.get_comparison(comparison_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
