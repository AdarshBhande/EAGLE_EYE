import pytest
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
from backend.app.schemas.qc import QCStatus, MatchStatus
from backend.app.services.qc_service import QCService

def make_source_ref(detail: str = "Test Ref") -> SourceReference:
    return SourceReference(file="sample_ga.pdf", type="GA", page=1, reference_detail=detail)

def make_suitable_image_metadata() -> ImageMetadata:
    return ImageMetadata(
        filename="test_cabinet.jpg",
        width=800,
        height=600,
        aspect_ratio=1.333,
        brightness=150.0,
        sharpness=500.0,
        quality_status="SUITABLE",
        quality_reasons=[]
    )

def make_unsuitable_image_metadata() -> ImageMetadata:
    return ImageMetadata(
        filename="dark_cabinet.jpg",
        width=800,
        height=600,
        aspect_ratio=1.333,
        brightness=20.0,
        sharpness=5.0,
        quality_status="UNSUITABLE",
        quality_reasons=["Severe underexposure / darkness"]
    )

# -------------------------------------------------------------------
# Test 1: Planted Fault 1 - Missing Component (PS12)
# -------------------------------------------------------------------
def test_fault_1_missing_component_ps12():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-FAULT-1",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref()),
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-FAULT-1",
        image_metadata=make_suitable_image_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-CB43",
                component_type="BREAKER",
                raw_tag="CB43",
                tag="CB43",
                confidence=0.95,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.25
            )
        ]
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    missing_issues = [i for i in result.issues if i.category == "MISSING_COMPONENT"]
    assert len(missing_issues) == 1
    assert missing_issues[0].expected == "Component 'PS12' (POWER_SUPPLY) present"

# -------------------------------------------------------------------
# Test 2: Planted Fault 2 - Positional Swap (CB43 / CB44)
# -------------------------------------------------------------------
def test_fault_2_swapped_components_cb43_cb44():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-FAULT-2",
        components=[
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", expected_order=1, source=make_source_ref()),
            ExpectedComponent(tag="CB44", raw_tag="CB44", component_type="BREAKER", expected_order=2, source=make_source_ref())
        ]
    )
    # CB44 observed above CB43 in photograph coordinates (smaller center_y)
    observed = ObservedCabinetModel(
        observation_id="OBS-FAULT-2",
        image_metadata=make_suitable_image_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-CB44",
                component_type="BREAKER",
                raw_tag="CB44",
                tag="CB44",
                confidence=0.92,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.20 # Higher in photo
            ),
            ObservedComponent(
                detection_id="DET-CB43",
                component_type="BREAKER",
                raw_tag="CB43",
                tag="CB43",
                confidence=0.95,
                bounding_box=BoundingBox(x1=100, y1=300, x2=200, y2=400),
                center_x=0.2,
                center_y=0.60 # Lower in photo
            )
        ]
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    order_issues = [i for i in result.issues if i.category == "ORDER_MISMATCH"]
    assert len(order_issues) == 1
    assert "Expected order: CB43 -> CB44" in order_issues[0].reason

# -------------------------------------------------------------------
# Test 3: Planted Fault 3 - Missing Label (1CBP03)
# -------------------------------------------------------------------
def test_fault_3_missing_label_1cbp03():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-FAULT-3",
        components=[
            ExpectedComponent(tag="1CBP03", raw_tag="1CBP03", component_type="BREAKER", source=make_source_ref())
        ],
        labels=[
            ExpectedLabel(label_id="LBL-01", text="1CBP03", raw_text="1CBP03", component_tag="1CBP03", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-FAULT-3",
        image_metadata=make_suitable_image_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-1CBP03",
                component_type="BREAKER",
                raw_tag="1CBP03",
                tag="1CBP03",
                confidence=0.90,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.2
            )
        ],
        detected_labels=[] # No label observed!
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    label_issues = [i for i in result.issues if i.category == "LABEL_MISMATCH"]
    assert len(label_issues) == 1
    assert "Expected label '1CBP03' was NOT observed" in label_issues[0].reason

# -------------------------------------------------------------------
# Test 4: Planted Fault 4 - Missing Ferrule (X3)
# -------------------------------------------------------------------
def test_fault_4_missing_ferrule_x3():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-FAULT-4",
        components=[
            ExpectedComponent(tag="X3", raw_tag="X3", component_type="TERMINAL", source=make_source_ref())
        ],
        ferrules=[
            ExpectedFerrule(ferrule_id="FER-01", text="X3-01", terminal_tag="X3", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-FAULT-4",
        image_metadata=make_suitable_image_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-X3",
                component_type="TERMINAL",
                raw_tag="X3",
                tag="X3",
                confidence=0.95,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.2
            )
        ],
        detected_ferrules=[] # Ferrule absent!
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.FAIL
    ferrule_issues = [i for i in result.issues if i.category == "FERRULE_MISMATCH"]
    assert len(ferrule_issues) == 1
    assert "Required wire ferrule 'X3-01' was NOT observed" in ferrule_issues[0].reason

# -------------------------------------------------------------------
# Test 5: Correct Cabinet (PASS)
# -------------------------------------------------------------------
def test_correct_cabinet_passes():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-PASS",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", expected_order=1, source=make_source_ref()),
            ExpectedComponent(tag="CB43", raw_tag="CB43", component_type="BREAKER", expected_order=2, source=make_source_ref())
        ],
        labels=[
            ExpectedLabel(label_id="LBL-01", text="PS12", raw_text="PS12", component_tag="PS12", source=make_source_ref())
        ],
        ferrules=[
            ExpectedFerrule(ferrule_id="FER-01", text="F-100", terminal_tag="PS12", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-PASS",
        image_metadata=make_suitable_image_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-PS12",
                component_type="POWER_SUPPLY",
                raw_tag="PS12",
                tag="PS12",
                confidence=0.96,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.2
            ),
            ObservedComponent(
                detection_id="DET-CB43",
                component_type="BREAKER",
                raw_tag="CB43",
                tag="CB43",
                confidence=0.94,
                bounding_box=BoundingBox(x1=100, y1=300, x2=200, y2=400),
                center_x=0.2,
                center_y=0.6
            )
        ],
        detected_labels=[
            ObservedLabel(label_id="LBL-OBS-01", raw_text="PS12", text="PS12", confidence=0.95, bounding_box=BoundingBox(x1=100, y1=80, x2=150, y2=95))
        ],
        detected_ferrules=[
            ObservedFerruleCandidate(ferrule_id="FER-OBS-01", raw_text="F-100", text="F-100", confidence=0.90, bounding_box=BoundingBox(x1=100, y1=205, x2=120, y2=215))
        ]
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.PASS
    assert len(result.issues) == 0

# -------------------------------------------------------------------
# Test 6: Ambiguous / Low Quality Image (REVIEW)
# -------------------------------------------------------------------
def test_unsuitable_image_quality_produces_review():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-REVIEW",
        components=[
            ExpectedComponent(tag="PS12", raw_tag="PS12", component_type="POWER_SUPPLY", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-DARK",
        image_metadata=make_unsuitable_image_metadata(), # Dark image
        detected_components=[]
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.REVIEW
    review_issues = [i for i in result.issues if i.status == QCStatus.REVIEW]
    assert len(review_issues) >= 1
    assert "UNSUITABLE" in review_issues[0].reason

# -------------------------------------------------------------------
# Test 7: Matching - Tag Normalization Matching (CB-43 vs CB43)
# -------------------------------------------------------------------
def test_tag_normalization_matching():
    expected = ExpectedCabinetModel(
        cabinet_id="CABINET-NORM",
        components=[
            ExpectedComponent(tag="CB43", raw_tag="CB-43", component_type="BREAKER", source=make_source_ref())
        ]
    )
    observed = ObservedCabinetModel(
        observation_id="OBS-NORM",
        image_metadata=make_suitable_image_metadata(),
        detected_components=[
            ObservedComponent(
                detection_id="DET-CB43",
                component_type="BREAKER",
                raw_tag="CB-43",
                tag="CB43", # Normalized tag matches
                confidence=0.91,
                bounding_box=BoundingBox(x1=100, y1=100, x2=200, y2=200),
                center_x=0.2,
                center_y=0.2
            )
        ]
    )

    service = QCService()
    result = service.evaluate_cabinet(expected, observed)

    assert result.overall_status == QCStatus.PASS
    assert result.matches[0].status == MatchStatus.MATCHED
    assert result.matches[0].expected_tag == "CB43"
