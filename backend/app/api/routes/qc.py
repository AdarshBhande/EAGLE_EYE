from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from ...schemas.expected_model import ExpectedCabinetModel
from ...schemas.observed_model import ObservedCabinetModel
from ...schemas.qc import InspectionResult
from ...services.qc_service import QCService

router = APIRouter(prefix="/qc", tags=["Quality Control Decision Engine"])

class QCEvaluationRequest(BaseModel):
    expected_model: ExpectedCabinetModel = Field(..., description="Normalized expected engineering cabinet model")
    observed_model: ObservedCabinetModel = Field(..., description="Observed visual cabinet model")

@router.post(
    "/evaluate",
    response_model=InspectionResult,
    summary="Evaluate Cabinet Quality Control Rules",
    description="Compares Expected Cabinet Model against Observed Cabinet Model using multi-signal matching and modular engineering QC rules. Returns deterministic PASS/FAIL/REVIEW status and structured issues."
)
def evaluate_cabinet_qc(request: QCEvaluationRequest) -> InspectionResult:
    try:
        service = QCService()
        result = service.evaluate_cabinet(
            expected_model=request.expected_model,
            observed_model=request.observed_model
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating cabinet QC rules: {str(e)}"
        )
