from fastapi import APIRouter
from ...schemas.common import HealthResponse
from ...core.config import settings

router = APIRouter(tags=["Health"])

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health Check",
    description="Returns backend status and service metadata."
)
def get_health():
    return HealthResponse(
        status="ok",
        service="eagle-eye-backend",
        version="1.0.0",
        environment=settings.APP_ENV
    )
