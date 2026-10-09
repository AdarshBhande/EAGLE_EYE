import pytest
import os
import shutil
from backend.app.core.config import settings
from backend.app.schemas.expected_model import (
    ExpectedCabinetModel,
    ExpectedComponent,
    ExpectedLabel,
    ExpectedFerrule,
    SourceReference
)
from backend.app.schemas.observed_model import (
    ObservedCabinetModel,
    ObservedComponent,
    ObservedLabel,
    ObservedFerruleCandidate,
    BoundingBox,
    ImageMetadata
)
from backend.app.schemas.qc import QCStatus
from backend.app.schemas.recheck import LifecycleState
from backend.app.cv.yolo_detector import YOLOComponentDetector
from backend.app.ocr.tesseract_engine import TesseractOCREngine
from backend.tests.mocks.test_detector import MockTestDetector
from backend.app.services.qc_service import QCService
from backend.app.services.evidence_service import EvidenceService
from backend.app.services.recheck_service import RecheckService
from backend.app.database.session import engine, Base, SessionLocal

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def make_source_ref(detail: str = "Acceptance Ref") -> SourceReference:
    return SourceReference(file="sample_ga.pdf", type="GA", page=1, reference_detail=detail)

def make_suitable_metadata() -> ImageMetadata:
    return ImageMetadata(
        filename="sample_cabinet.jpg",
        width=800,
        height=600,
        aspect_ratio=1.333,
        brightness=150.0,
        sharpness=500.0,
        quality_status="SUITABLE",
        quality_reasons=[]
    )

# -------------------------------------------------------------------
# Test 1: AI Model & OCR Engine Availability Audit
# -------------------------------------------------------------------
def test_ai_model_readiness_audit():
    """
    Verifies that YOLO adapter correctly reports model readiness when model weights exist,
    and OCR engine correctly reports missing Tesseract native binary.
    """
    detector = YOLOComponentDetector()
    info = detector.get_info()
    
    assert info["has_weights"] is True
    assert info["load_error"] is None

    ocr_engine = TesseractOCREngine()
    assert ocr_engine.is_available is False

# -------------------------------------------------------------------
# Test 2: Planted Fault 1 Validation (PS12 Missing)
# -------------------------------------------------------------------
def test_acceptance_planted_fault_1_ps12_missing():
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-ACCEPTANCE-1",
        components=[ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())]
    )
    test_detector = MockTestDetector(preset_objects=[])
    detections = test_detector.detect("data/sample/sample_cabinet.jpg")

    observed = ObservedCabinetModel(
        observation_id="OBS-ACCEPTANCE-1",
        image_metadata=make_suitable_metadata(),
        detected_components=[]
    )

    qc_service = QCService()
    result = qc_service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    missing = [i for i in result.issues if i.category == "MISSING_COMPONENT"]
    assert len(missing) == 1
    assert missing[0].expected == "Component 'PS12' (POWER_SUPPLY) present"

# -------------------------------------------------------------------
# Test 3: Planted Fault 2 Validation (CB43 / CB44 Swapped)
# -------------------------------------------------------------------
def test_acceptance_planted_fault_2_cb43_cb44_swapped():
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-ACCEPTANCE-2",
        components=[
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", expected_order=1, source=make_source_ref()),
            ExpectedComponent(tag="CB44", raw_tag="CB44", component_type="BREAKER", expected_order=2, source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-ACCEPTANCE-2",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-CB44", component_type="BREAKER", raw_tag="CB44", tag="CB44", confidence=0.92, bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200), center_x=0.2, center_y=0.2),
            ObservedComponent(detection_id="D-CB43", component_type="BREAKER", raw_tag="CB43", tag="CB43", confidence=0.95, bounding_box=BoundingBox(x1=100, y1=300, x2=200, y2=400), center_x=0.2, center_y=0.6)
        ]
    )

    qc_service = QCService()
    result = qc_service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    order_issues = [i for i in result.issues if i.category == "ORDER_MISMATCH"]
    assert len(order_issues) == 1
    assert "Expected order: CB43 -> CB44" in order_issues[0].reason

# -------------------------------------------------------------------
# Test 4: Planted Fault 3 Validation (1CBP03 Label Missing)
# -------------------------------------------------------------------
def test_acceptance_planted_fault_3_1cbp03_label_missing():
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-ACCEPTANCE-3",
        components=[ExpectedComponent(tag="1CBP03", raw_tag="1CBP03", component_type="BREAKER", source=make_source_ref())],
        labels=[ExpectedLabel(label_id="L-1", text="1CBP03", raw_text="1CBP03", component_tag="1CBP03", source=make_source_ref())]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-ACCEPTANCE-3",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-1CBP03", component_type="BREAKER", raw_tag="1CBP03", tag="1CBP03", confidence=0.9, bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200), center_x=0.2, center_y=0.2)
        ],
        detected_labels=[]
    )

    qc_service = QCService()
    result = qc_service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    label_issues = [i for i in result.issues if i.category == "LABEL_MISMATCH"]
    assert len(label_issues) == 1

# -------------------------------------------------------------------
# Test 5: Planted Fault 4 Validation (X3 Ferrule Missing)
# -------------------------------------------------------------------
def test_acceptance_planted_fault_4_x3_ferrule_missing():
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-ACCEPTANCE-4",
        components=[ExpectedComponent(tag="X3", raw_tag="X3", component_type="TERMINAL", source=make_source_ref())],
        ferrules=[ExpectedFerrule(ferrule_id="F-1", text="X3-01", terminal_tag="X3", source=make_source_ref())]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-ACCEPTANCE-4",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-X3", component_type="TERMINAL", raw_tag="X3", tag="X3", confidence=0.9, bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200), center_x=0.2, center_y=0.2)
        ],
        detected_ferrules=[]
    )

    qc_service = QCService()
    result = qc_service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    ferrule_issues = [i for i in result.issues if i.category == "FERRULE_MISMATCH"]
    assert len(ferrule_issues) == 1

# -------------------------------------------------------------------
# Test 6: False Positive Validation (Correct Cabinet = PASS)
# -------------------------------------------------------------------
def test_acceptance_correct_cabinet_false_positive_zero():
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-ACCEPTANCE-PASS",
        components=[ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())],
        labels=[ExpectedLabel(label_id="L-1", text="PS12", raw_text="PS12", component_tag="PS12", source=make_source_ref())]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-ACCEPTANCE-PASS",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-PS12", component_type="POWER_SUPPLY", raw_tag="PS12", tag="PS12", confidence=0.95, bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200), center_x=0.2, center_y=0.2)
        ],
        detected_labels=[
            ObservedLabel(label_id="LOBS-1", raw_text="PS12", text="PS12", confidence=0.95, bounding_box=BoundingBox(x1=100, y1=80, x2=150, y2=95))
        ]
    )

    qc_service = QCService()
    result = qc_service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.PASS
    assert len(result.issues) == 0

# -------------------------------------------------------------------
# Test 7: Re-check Lifecycle Acceptance Validation
# -------------------------------------------------------------------
def test_acceptance_recheck_lifecycle(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-RECHECK-ACCEPT",
        components=[ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())]
    )
    obs1 = ObservedCabinetModel(observation_id="OBS-ACCEPT-1", image_metadata=make_suitable_metadata(), detected_components=[])
    qc_service = QCService()
    qc1 = qc_service.evaluate_cabinet(expected, obs1)

    recheck_service = RecheckService()
    ins1 = recheck_service.persist_inspection(qc1, expected, obs1, db=test_db)

    obs2 = ObservedCabinetModel(
        observation_id="OBS-ACCEPT-2",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-PS12", component_type="POWER_SUPPLY", raw_tag="PS12", tag="PS12", confidence=0.95, bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200), center_x=0.2, center_y=0.2)
        ]
    )
    qc2 = qc_service.evaluate_cabinet(expected, obs2)
    recheck_res = recheck_service.perform_recheck(ins1.inspection_id, qc2, expected, obs2, db=test_db)

    assert recheck_res.summary.resolved == 1
    assert recheck_res.summary.final_status == QCStatus.PASS
