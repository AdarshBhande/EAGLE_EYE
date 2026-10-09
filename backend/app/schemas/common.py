from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="ok", json_schema_extra={"example": "ok"})
    service: str = Field(default="eagle-eye-backend", json_schema_extra={"example": "eagle-eye-backend"})
    version: str = Field(default="1.0.0", json_schema_extra={"example": "1.0.0"})
    environment: str = Field(default="development", json_schema_extra={"example": "development"})

class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error explanation")
    code: str = Field(default="GENERAL_ERROR", description="Error code identifier")
