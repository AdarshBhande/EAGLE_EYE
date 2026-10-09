from typing import List, Dict, Any
import numpy as np
from app.cv.detector import BaseComponentDetector, DetectedObject

class MockTestDetector(BaseComponentDetector):
    """
    Deterministic mock component detector ONLY for automated testing.
    Production code must never silently fall back to this mock.
    """

    def __init__(self, preset_objects: List[DetectedObject] = None):
        self.preset_objects = preset_objects or []

    def detect(self, image: np.ndarray) -> List[DetectedObject]:
        return self.preset_objects

    def get_info(self) -> Dict[str, Any]:
        return {
            "detector_type": "MockTestDetector",
            "is_mock": True,
            "preset_count": len(self.preset_objects)
        }
