import os
import pytest
from pathlib import Path
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
    BoundingBox,
    ImageMetadata
)
from backend.app.schemas.qc import QCStatus
from backend.app.schemas.evidence import EvidenceType, EvidenceCollection
from backend.app.services.qc_service import QCService
from backend.app.services.evidence_service import EvidenceService

def make_source_ref(detail: str = "Test Ref") -> SourceReference:
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
# Test 1: FAIL with Bounding Box
# -------------------------------------------------------------------
def test_evidence_generation_fail_with_bounding_box(tmp_path):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-EVI-1",
        components=[
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-EVI-1",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-CB43",
                component_type="TERMINAL_BLOCK", # Type mismatch -> FAIL
                raw_tag="CB43",
                tag="CB43",
                confidence=0.92,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.2
            )
        ]
    )

    qc_service = QCService()
    inspection_result = qc_service.evaluate_cabinet(expected, observed)

    evi_service = EvidenceService(storage_dir=str(tmp_path))
    collection = evi_service.generate_evidence_for_inspection(
        inspection_result=inspection_result,
        observed_model=observed
    )

    assert len(collection.evidence_items) == 1
    item = collection.evidence_items[0]
    assert item.issue_status == QCStatus.FAIL
    assert item.evidence_type == EvidenceType.DEFECT_CROP
    assert item.bounding_box is not None
    assert item.crop_reference is not None

    # Check file exists on disk
    crop_path = tmp_path / "evidence" / "crops" / item.crop_reference.file_name
    assert crop_path.exists()

# -------------------------------------------------------------------
# Test 2: FAIL without Bounding Box (Missing Component)
# -------------------------------------------------------------------
def test_evidence_generation_missing_component_no_fabricated_bbox(tmp_path):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-EVI-2",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-EVI-2",
        image_metadata=make_suitable_metadata(),
        detected_components=[] # PS12 missing
    )

    qc_service = QCService()
    inspection_result = qc_service.evaluate_cabinet(expected, observed)

    evi_service = EvidenceService(storage_dir=str(tmp_path))
    collection = evi_service.generate_evidence_for_inspection(
        inspection_result=inspection_result,
        observed_model=observed
    )

    assert len(collection.evidence_items) == 1
    item = collection.evidence_items[0]
    assert item.issue_status == QCStatus.FAIL
    assert item.evidence_type == EvidenceType.EVIDENCE_CARD
    assert item.bounding_box is None # Zero fabricated bounding box!
    assert item.expected_value == "Component 'PS12' (POWER_SUPPLY) present"

    # Card file created
    card_path = tmp_path / "evidence" / "cards" / item.crop_reference.file_name
    assert card_path.exists()

# -------------------------------------------------------------------
# Test 3: Crop Boundary Safety (Edges 0, 0, width, height)
# -------------------------------------------------------------------
def test_crop_boundary_safety(tmp_path):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-EDGE",
        components=[
            ExpectedComponent(tag="EDGE1", raw_tag="EDGE1", component_type="BREAKER", source=make_source_ref())
        ]
    )
    # Bounding box right against top-left corner (0,0)
    observed = ObservedCabinetModel(
        observation_id="OBS-EDGE",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-EDGE",
                component_type="OTHER", # Mismatch
                raw_tag="EDGE1",
                tag="EDGE1",
                confidence=0.90,
                bounding_box=BoundingBox(x1=0, y1=0, x2=50, y2=50),
                center_x=0.03,
                center_y=0.04
            )
        ]
    )

    qc_service = QCService()
    inspection_result = qc_service.evaluate_cabinet(expected, observed)

    evi_service = EvidenceService(storage_dir=str(tmp_path))
    collection = evi_service.generate_evidence_for_inspection(
        inspection_result=inspection_result,
        observed_model=observed
    )

    assert len(collection.evidence_items) == 1
    item = collection.evidence_items[0]
    crop_path = tmp_path / "evidence" / "crops" / item.crop_reference.file_name
    assert crop_path.exists()

# -------------------------------------------------------------------
# Test 4: Every FAIL Gets an EvidenceItem
# -------------------------------------------------------------------
def test_every_fail_issue_gets_evidence_item(tmp_path):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-MULTI",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref()),
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", source=make_source_ref())
        ],
        labels=[
            ExpectedLabel(label_id="LBL-1", text="1CBP03", raw_text="1CBP03", component_tag="CB43", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-MULTI",
        image_metadata=make_suitable_metadata(),
        detected_components=[] # Everything missing -> multiple FAILs
    )

    qc_service = QCService()
    inspection_result = qc_service.evaluate_cabinet(expected, observed)

    fail_issues_count = sum(1 for i in inspection_result.issues if i.status == QCStatus.FAIL)
    assert fail_issues_count > 0

    evi_service = EvidenceService(storage_dir=str(tmp_path))
    collection = evi_service.generate_evidence_for_inspection(
        inspection_result=inspection_result,
        observed_model=observed
    )

    # Confirm every FAIL issue has a matching EvidenceItem
    fail_evidence_ids = {e.issue_id for e in collection.evidence_items if e.issue_status == QCStatus.FAIL}
    fail_issue_ids = {i.issue_id for i in inspection_result.issues if i.status == QCStatus.FAIL}
    assert fail_issue_ids.issubset(fail_evidence_ids)

# -------------------------------------------------------------------
# Test 5: Master Annotated Image Created
# -------------------------------------------------------------------
def test_master_annotated_image_created(tmp_path):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-MASTER",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-MASTER",
        image_metadata=make_suitable_metadata(),
        detected_components=[]
    )

    qc_service = QCService()
    inspection_result = qc_service.evaluate_cabinet(expected, observed)

    evi_service = EvidenceService(storage_dir=str(tmp_path))
    collection = evi_service.generate_evidence_for_inspection(
        inspection_result=inspection_result,
        observed_model=observed
    )

    assert collection.annotated_full_image is not None
    master_path = tmp_path / "evidence" / "annotated" / collection.annotated_full_image.file_name
    assert master_path.exists()
