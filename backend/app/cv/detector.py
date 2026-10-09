from abc import ABC, abstractmethod
from typing import List, Dict, Any
import numpy as np

class DetectedObject:
    """
    Standardized detection result object returned by all component detectors.
    """
    def __init__(
        self,
        class_name: str,
        confidence: float,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        raw_metadata: Dict[str, Any] = None
    ):
        self.class_name = class_name
        self.confidence = float(confidence)
        self.x1 = float(x1)
        self.y1 = float(y1)
        self.x2 = float(x2)
        self.y2 = float(y2)
        self.raw_metadata = raw_metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_name": self.class_name,
            "confidence": self.confidence,
            "bbox": [self.x1, self.y1, self.x2, self.y2],
            "raw_metadata": self.raw_metadata
        }

class BaseComponentDetector(ABC):
    """
    Abstract Component Detector Interface.
    Decouples computer vision inference from downstream application logic.
    """

    @abstractmethod
    def detect(self, image: np.ndarray) -> List[DetectedObject]:
        """
        Runs component detection on an input BGR OpenCV image.
        Returns list of DetectedObject instances.
        """
        pass

    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """
        Returns detector diagnostic info (model path, device, weights availability).
        """
        pass
