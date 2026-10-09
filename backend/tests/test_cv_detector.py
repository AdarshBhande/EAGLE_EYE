import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.cv.detector import DetectedObject
from backend.app.cv.yolo_detector import YOLOComponentDetector
from backend.tests.mocks.test_detector import MockTestDetector

def test_detected_object_contract():
    obj = DetectedObject(
        class_name="circuit_breaker",
        confidence=0.92,
        x1=10, y1=20, x2=110, y2=120,
        raw_metadata={"tag": "CB43"}
    )

    assert obj.class_name == "circuit_breaker"
    assert obj.confidence == 0.92
    d = obj.to_dict()
    assert d["bbox"] == [10.0, 20.0, 110.0, 120.0]

def test_yolo_detector_no_weights_graceful():
    detector = YOLOComponentDetector(model_path="non_existent_weights.pt")
    info = detector.get_info()

    assert info["has_weights"] is False
    assert "not found" in info["load_error"].lower()

    # Detections should return empty list without throwing exception
    dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
    detections = detector.detect(dummy_img)
    assert detections == []

def test_mock_test_detector():
    preset = [
        DetectedObject("power_supply", 0.95, 100, 80, 300, 180),
        DetectedObject("circuit_breaker", 0.89, 350, 80, 550, 180)
    ]
    mock_det = MockTestDetector(preset_objects=preset)
    info = mock_det.get_info()

    assert info["is_mock"] is True
    dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
    results = mock_det.detect(dummy_img)
    assert len(results) == 2
    assert results[0].class_name == "power_supply"
