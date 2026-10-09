from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json

class Settings(BaseSettings):
    APP_NAME: str = "EAGLE EYE Backend"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./eagle_eye.db"

    STORAGE_DIR: str = "./storage"
    MODEL_DIR: str = "./models/weights"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Vision & Detection Configuration
    VISION_MODEL_PATH: str = "./models/weights/cabinet_yolov8.pt"
    VISION_CONFIDENCE_THRESHOLD: float = 0.25
    VISION_IOU_THRESHOLD: float = 0.45
    VISION_IMAGE_SIZE: int = 640
    VISION_DEVICE: str = "cpu"

    # OCR Configuration
    OCR_ENGINE: str = "tesseract"
    OCR_CONFIDENCE_THRESHOLD: float = 0.30

    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
