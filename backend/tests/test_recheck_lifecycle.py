import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.session import Base
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
from backend.app.schemas.recheck import LifecycleState, compute_issue_fingerprint
from backend.app.services.qc_service import QCService
from backend.app.services.evidence_service import EvidenceService
from backend.app.services.recheck_service import RecheckService

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

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
# Test 1 & 2: Persist & Retrieve Inspection
# -------------------------------------------------------------------
def test_persist_and_retrieve_inspection(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-PERSIST-1",
        components=[ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-PERSIST-1",
        image_metadata=make_suitable_metadata(),
        detected_components=[]
    )
    qc_service = QCService()
    qc_result = qc_service.evaluate_cabinet(expected, observed)

    recheck_service = RecheckService()
    persisted = recheck_service.persist_inspection(qc_result, expected, observed, db=test_db)

    assert persisted.inspection_id == qc_result.inspection_id
    assert persisted.cabinet_id == "CAB-PERSIST-1"
    assert persisted.overall_status == QCStatus.FAIL
    assert len(persisted.issues) == 1

    retrieved = recheck_service.get_inspection(qc_result.inspection_id, db=test_db)
    assert retrieved.inspection_id == qc_result.inspection_id
    assert len(retrieved.issues) == 1

# -------------------------------------------------------------------
# Test 3: Persist Multiple Inspections
# -------------------------------------------------------------------
def test_persist_multiple_inspections(test_db):
    recheck_service = RecheckService()
    qc_service = QCService()

    for i in range(3):
        exp = ExpectedCabinetModel(cabinet_id=f"CAB-MULTI-{i}", components=[])
        obs = ObservedCabinetModel(observation_id=f"OBS-MULTI-{i}", image_metadata=make_suitable_metadata())
        res = qc_service.evaluate_cabinet(exp, obs)
        recheck_service.persist_inspection(res, exp, obs, db=test_db)

    all_inspections = recheck_service.list_inspections(db=test_db)
    assert len(all_inspections) == 3

# -------------------------------------------------------------------
# Test 4, 5: PS12 Missing Fixed -> RESOLVED & Immutability Check
# -------------------------------------------------------------------
def test_fault_1_ps12_fixed_becomes_resolved(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-RECHECK-1",
        components=[ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())]
    )
    # Inspection 1: PS12 missing -> FAIL
    obs1 = ObservedCabinetModel(observation_id="OBS-1", image_metadata=make_suitable_metadata(), detected_components=[])
    qc_service = QCService()
    qc1 = qc_service.evaluate_cabinet(expected, obs1)

    recheck_service = RecheckService()
    ins1 = recheck_service.persist_inspection(qc1, expected, obs1, db=test_db)

    # Inspection 2 (Re-check): PS12 installed -> PASS
    obs2 = ObservedCabinetModel(
        observation_id="OBS-2",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-PS12", component_type="POWER_SUPPLY", raw_tag="PS12", tag="PS12", confidence=0.95,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200), center_x=0.2, center_y=0.2
            )
        ]
    )
    qc2 = qc_service.evaluate_cabinet(expected, obs2)
    recheck_result = recheck_service.perform_recheck(
        previous_inspection_id=ins1.inspection_id,
        current_inspection_result=qc2,
        current_expected_model=expected,
        current_observed_model=obs2,
        db=test_db
    )

    assert recheck_result.summary.resolved == 1
    assert recheck_result.summary.still_open == 0
    assert recheck_result.summary.final_status == QCStatus.PASS
    assert len(recheck_result.resolved_issues) == 1
    assert recheck_result.resolved_issues[0].lifecycle_state == LifecycleState.RESOLVED

    # Immutability check: Inspection 1 must remain completely unchanged!
    ins1_after = recheck_service.get_inspection(ins1.inspection_id, db=test_db)
    assert ins1_after.overall_status == QCStatus.FAIL
    assert ins1_after.issues[0].lifecycle_state == LifecycleState.OPEN

# -------------------------------------------------------------------
# Test 6: 1CBP03 Label Missing Fixed -> RESOLVED
# -------------------------------------------------------------------
def test_fault_3_label_fixed_becomes_resolved(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-LBL",
        components=[ExpectedComponent(tag="1CBP03", raw_tag="1CBP03", component_type="BREAKER", source=make_source_ref())],
        labels=[ExpectedLabel(label_id="LBL-1", text="1CBP03", raw_text="1CBP03", component_tag="1CBP03", source=make_source_ref())]
    )
    obs1 = ObservedCabinetModel(observation_id="OBS-LBL-1", image_metadata=make_suitable_metadata(), detected_labels=[])
    qc_service = QCService()
    qc1 = qc_service.evaluate_cabinet(expected, obs1)

    recheck_service = RecheckService()
    ins1 = recheck_service.persist_inspection(qc1, expected, obs1, db=test_db)

    # Recheck with label attached
    obs2 = ObservedCabinetModel(
        observation_id="OBS-LBL-2",
        image_metadata=make_suitable_metadata(),
        detected_labels=[ObservedLabel(label_id="LBL-OBS-1", raw_text="1CBP03", text="1CBP03", confidence=0.95, bounding_box=BoundingBox(x1=10, y1=10, x2=50, y2=30))]
    )
    qc2 = qc_service.evaluate_cabinet(expected, obs2)
    recheck_result = recheck_service.perform_recheck(ins1.inspection_id, qc2, expected, obs2, db=test_db)

    assert recheck_result.summary.resolved >= 1

# -------------------------------------------------------------------
# Test 7: X3 Ferrule Fixed -> RESOLVED
# -------------------------------------------------------------------
def test_fault_4_ferrule_fixed_becomes_resolved(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-FER",
        components=[ExpectedComponent(tag="X3", raw_tag="X3", component_type="TERMINAL", source=make_source_ref())],
        ferrules=[ExpectedFerrule(ferrule_id="FER-1", text="X3-01", terminal_tag="X3", source=make_source_ref())]
    )
    obs1 = ObservedCabinetModel(observation_id="OBS-FER-1", image_metadata=make_suitable_metadata(), detected_ferrules=[])
    qc_service = QCService()
    qc1 = qc_service.evaluate_cabinet(expected, obs1)

    recheck_service = RecheckService()
    ins1 = recheck_service.persist_inspection(qc1, expected, obs1, db=test_db)

    # Recheck with ferrule attached
    obs2 = ObservedCabinetModel(
        observation_id="OBS-FER-2",
        image_metadata=make_suitable_metadata(),
        detected_ferrules=[ObservedFerruleCandidate(ferrule_id="FER-OBS-1", raw_text="X3-01", text="X3-01", confidence=0.92, bounding_box=BoundingBox(x1=10, y1=10, x2=50, y2=30))]
    )
    qc2 = qc_service.evaluate_cabinet(expected, obs2)
    recheck_result = recheck_service.perform_recheck(ins1.inspection_id, qc2, expected, obs2, db=test_db)

    assert recheck_result.summary.resolved >= 1

# -------------------------------------------------------------------
# Test 8: CB43/CB44 Swapped Fixed -> RESOLVED
# -------------------------------------------------------------------
def test_fault_2_swap_fixed_becomes_resolved(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-SWAP",
        components=[
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", expected_order=1, source=make_source_ref()),
            ExpectedComponent(tag="CB44", raw_tag="CB44", component_type="BREAKER", expected_order=2, source=make_source_ref())
        ]
    )
    # Obs 1: Swapped order
    obs1 = ObservedCabinetModel(
        observation_id="OBS-SWAP-1",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-CB44", component_type="BREAKER", raw_tag="CB44", tag="CB44", confidence=0.9, bounding_box=BoundingBox(x1=10, y1=10, x2=50, y2=50), center_x=0.2, center_y=0.2),
            ObservedComponent(detection_id="D-CB43", component_type="BREAKER", raw_tag="CB43", tag="CB43", confidence=0.9, bounding_box=BoundingBox(x1=10, y1=100, x2=50, y2=150), center_x=0.2, center_y=0.6)
        ]
    )
    qc_service = QCService()
    qc1 = qc_service.evaluate_cabinet(expected, obs1)

    recheck_service = RecheckService()
    ins1 = recheck_service.persist_inspection(qc1, expected, obs1, db=test_db)

    # Obs 2: Correct order
    obs2 = ObservedCabinetModel(
        observation_id="OBS-SWAP-2",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-CB43-OK", component_type="BREAKER", raw_tag="CB43", tag="CB43", confidence=0.9, bounding_box=BoundingBox(x1=10, y1=10, x2=50, y2=50), center_x=0.2, center_y=0.2),
            ObservedComponent(detection_id="D-CB44-OK", component_type="BREAKER", raw_tag="CB44", tag="CB44", confidence=0.9, bounding_box=BoundingBox(x1=10, y1=100, x2=50, y2=150), center_x=0.2, center_y=0.6)
        ]
    )
    qc2 = qc_service.evaluate_cabinet(expected, obs2)
    recheck_result = recheck_service.perform_recheck(ins1.inspection_id, qc2, expected, obs2, db=test_db)

    assert recheck_result.summary.resolved >= 1
    assert recheck_result.summary.final_status == QCStatus.PASS

# -------------------------------------------------------------------
# Test 9, 10, 11: Mixed Case (Resolved, Still Open, New)
# -------------------------------------------------------------------
def test_mixed_recheck_lifecycle_states(test_db):
    expected = ExpectedCabinetModel(
        cabinet_id="CAB-MIX",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref()),
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", source=make_source_ref()),
            ExpectedComponent(tag="CB44", raw_tag="CB44", component_type="BREAKER", source=make_source_ref())
        ]
    )
    # Inspection 1: PS12 missing, CB43 missing, CB44 missing
    obs1 = ObservedCabinetModel(observation_id="OBS-MIX-1", image_metadata=make_suitable_metadata(), detected_components=[])
    qc_service = QCService()
    qc1 = qc_service.evaluate_cabinet(expected, obs1)

    recheck_service = RecheckService()
    ins1 = recheck_service.persist_inspection(qc1, expected, obs1, db=test_db)

    # Inspection 2:
    # PS12 installed -> RESOLVED
    # CB43 still missing -> STILL_OPEN
    # CB99 extra component installed -> NEW
    obs2 = ObservedCabinetModel(
        observation_id="OBS-MIX-2",
        image_metadata=make_suitable_metadata(),
        detected_components=[
            ObservedComponent(detection_id="D-PS12", component_type="POWER_SUPPLY", raw_tag="PS12", tag="PS12", confidence=0.95, bounding_box=BoundingBox(x1=10, y1=10, x2=50, y2=50), center_x=0.2, center_y=0.2),
            ObservedComponent(detection_id="D-CB44", component_type="BREAKER", raw_tag="CB44", tag="CB44", confidence=0.95, bounding_box=BoundingBox(x1=10, y1=100, x2=50, y2=150), center_x=0.2, center_y=0.5),
            ObservedComponent(detection_id="D-CB99", component_type="BREAKER", raw_tag="CB99", tag="CB99", confidence=0.90, bounding_box=BoundingBox(x1=10, y1=200, x2=50, y2=250), center_x=0.2, center_y=0.8)
        ]
    )
    qc2 = qc_service.evaluate_cabinet(expected, obs2)
    recheck_result = recheck_service.perform_recheck(ins1.inspection_id, qc2, expected, obs2, db=test_db)

    assert recheck_result.summary.resolved >= 1 # PS12 fixed
    assert recheck_result.summary.still_open >= 1 # CB43 still missing
    assert recheck_result.summary.new >= 1 # CB99 extra component
    assert recheck_result.summary.final_status in (QCStatus.FAIL, QCStatus.REVIEW)



# -------------------------------------------------------------------
# Test 12: Stable Issue Fingerprint Matching
# -------------------------------------------------------------------
def test_stable_issue_fingerprint():
    fp1 = compute_issue_fingerprint("RULE-PRESENCE-001", "MISSING_COMPONENT", "Component 'PS12' (POWER_SUPPLY) present")
    fp2 = compute_issue_fingerprint("RULE-PRESENCE-001", "MISSING_COMPONENT", "Component 'PS12' (POWER_SUPPLY) present")
    assert fp1 == fp2
    assert len(fp1) == 16
