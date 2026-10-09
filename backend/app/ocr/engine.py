from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
import cv2
import re
from ..schemas.observed_model import BoundingBox
from ..utils.normalization import normalize_tag

class OCRResult:
    """
    Standardized OCR text recognition result.
    """
    def __init__(self, raw_text: str, confidence: float, bounding_box: Optional[BoundingBox] = None):
        self.raw_text = raw_text.strip()
        self.normalized_text = normalize_tag(self.raw_text)
        self.confidence = float(confidence)
        self.bounding_box = bounding_box or BoundingBox(x1=0, y1=0, x2=0, y2=0)

class BaseOCREngine(ABC):
    """
    Abstract OCR Engine Interface.
    Decouples optical character recognition implementation from vision services.
    """

    @abstractmethod
    def recognize(self, crop_bgr: np.ndarray) -> List[OCRResult]:
        """
        Runs text recognition on a cropped BGR image region.
        Returns list of OCRResult objects.
        """
        pass

    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """
        Returns OCR engine status and binary availability diagnostic.
        """
        pass
