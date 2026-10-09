import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.schemas.observed_model import ObservedCabinetModel, BoundingBox, ObservedComponent
from backend.app.cv.detector import DetectedObject
from backend.app.cv.spatial import SpatialAnalyzer
from backend.app.services.observed_model_service import ObservedModelService
from backend.tests.mocks.test_detector import MockTestDetector

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_spatial_analyzer():
    bbox = BoundingBox(x1=100, y1=100, x2=300, y2=200)
    assert bbox.width == 200.0
    assert bbox.height == 100.0
    assert bbox.center_x == 200.0
    assert bbox.center_y == 150.0

    norm_x, norm_y = SpatialAnalyzer.calculate_center_normalized(bbox, 800, 600)
    assert norm_x == 0.25
    assert norm_y == 0.25

def test_observed_model_service_with_mock_detector():
    img_path = os.path.join(FIXTURES_DIR, "sample_cabinet.jpg")
    assert os.path.exists(img_path)

    preset_detections = [
        DetectedObject("power_supply", 0.95, 100, 80, 300, 180),
        DetectedObject("circuit_breaker", 0.91, 350, 80, 550, 180),
        DetectedObject("circuit_breaker", 0.88, 100, 240, 300, 340)
    ]
    mock_detector = MockTestDetector(preset_objects=preset_detections)

    service = ObservedModelService(detector=mock_detector, observation_id="OBS-TEST-101")
    observed_model = service.inspect_image(image_source=img_path)

    assert isinstance(observed_model, ObservedCabinetModel)
    assert observed_model.observation_id == "OBS-TEST-101"
    assert len(observed_model.detected_components) == 3
    assert observed_model.image_metadata.width == 800

    # Ensure no PASS/FAIL is emitted in Phase 3
    model_dict = observed_model.model_dump()
    assert "status" not in model_dict
    assert "pass" not in str(model_dict).lower()

    # Spatial row index verification
    row_indices = [c.row_index for c in observed_model.detected_components]
    assert len(row_indices) == 3

def test_observed_model_json_serialization_roundtrip():
    img_path = os.path.join(FIXTURES_DIR, "sample_cabinet.jpg")
    preset_detections = [DetectedObject("breaker", 0.90, 50, 50, 150, 150)]
    mock_detector = MockTestDetector(preset_objects=preset_detections)

    service = ObservedModelService(detector=mock_detector, observation_id="OBS-JSON-001")
    m1 = service.inspect_image(img_path)

    json_data = m1.model_dump_json()
    assert isinstance(json_data, str)
    assert "OBS-JSON-001" in json_data

    m2 = ObservedCabinetModel.model_validate_json(json_data)
    assert m2.observation_id == m1.observation_id
    assert len(m2.detected_components) == len(m1.detected_components)
    assert m2.image_metadata.width == m1.image_metadata.width
