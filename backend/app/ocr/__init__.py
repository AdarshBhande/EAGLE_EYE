from .engine import BaseOCREngine, OCRResult
from .tesseract_engine import TesseractOCREngine, HeuristicFallbackOCREngine

__all__ = [
    "BaseOCREngine",
    "OCRResult",
    "TesseractOCREngine",
    "HeuristicFallbackOCREngine"
]
