import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.schemas.expected_model import ExpectedCabinetModel
from backend.app.services.expected_model_service import ExpectedModelService
from backend.app.utils.normalization import normalize_tag, infer_component_type

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_normalization_utils():
    assert normalize_tag("CB-43") == "CB43"
    assert normalize_tag("CB 43") == "CB43"
    assert normalize_tag("cb43") == "CB43"
    assert normalize_tag("1CBP-03") == "1CBP03"
    assert normalize_tag("PS-12") == "PS12"
    assert normalize_tag("X-3") == "X3"

    assert infer_component_type("PS12") == "POWER_SUPPLY"
    assert infer_component_type("CB43") == "CIRCUIT_BREAKER"
    assert infer_component_type("X3") == "TERMINAL_BLOCK"

def test_build_expected_model_integration():
    ga_path = os.path.join(FIXTURES_DIR, "sample_ga.pdf")
    excel_path = os.path.join(FIXTURES_DIR, "sample_wire_list.xlsx")

    service = ExpectedModelService(cabinet_id="CABINET-TEST-001")
    model = service.build_expected_model(
        ga_pdf_path=ga_path,
        excel_path=excel_path
    )

    assert isinstance(model, ExpectedCabinetModel)
    assert model.cabinet_id == "CABINET-TEST-001"
    assert len(model.components) >= 4
    assert len(model.wires) == 3
    assert len(model.sources) == 2

    # Validation summary check
    assert model.validation.status in ("VALID", "WARNING", "CONFLICT")

def test_json_serialization_roundtrip():
    ga_path = os.path.join(FIXTURES_DIR, "sample_ga.pdf")
    excel_path = os.path.join(FIXTURES_DIR, "sample_wire_list.xlsx")

    service = ExpectedModelService(cabinet_id="CABINET-ROUNDTRIP-99")
    original_model = service.build_expected_model(
        ga_pdf_path=ga_path,
        excel_path=excel_path
    )

    # 1. Serialize to JSON string
    json_str = original_model.model_dump_json()
    assert isinstance(json_str, str)
    assert "CABINET-ROUNDTRIP-99" in json_str

    # 2. Deserialize back to Pydantic object
    deserialized_model = ExpectedCabinetModel.model_validate_json(json_str)

    # 3. Assert zero data loss
    assert deserialized_model.cabinet_id == original_model.cabinet_id
    assert len(deserialized_model.components) == len(original_model.components)
    assert len(deserialized_model.wires) == len(original_model.wires)
    assert deserialized_model.validation.status == original_model.validation.status

def test_build_expected_model_ga_only():
    ga_path = os.path.join(FIXTURES_DIR, "sample_ga.pdf")
    service = ExpectedModelService(cabinet_id="CAB-GA-ONLY")
    model = service.build_expected_model(ga_pdf_path=ga_path)

    assert isinstance(model, ExpectedCabinetModel)
    assert model.cabinet_id == "CAB-GA-ONLY"
    assert len(model.components) >= 4
    assert len(model.sources) == 1
    assert model.sources[0].type == "GA"
    assert "ga_summary" in model.metadata

def test_build_expected_model_excel_only():
    excel_path = os.path.join(FIXTURES_DIR, "sample_wire_list.xlsx")
    service = ExpectedModelService(cabinet_id="CAB-EXCEL-ONLY")
    model = service.build_expected_model(excel_path=excel_path)

    assert isinstance(model, ExpectedCabinetModel)
    assert model.cabinet_id == "CAB-EXCEL-ONLY"
    assert len(model.wires) == 3
    assert len(model.sources) == 1
    assert model.sources[0].type == "EXCEL"
    assert "excel_summary" in model.metadata

def test_build_expected_model_empty():
    service = ExpectedModelService(cabinet_id="CAB-EMPTY")
    model = service.build_expected_model()

    assert isinstance(model, ExpectedCabinetModel)
    assert model.cabinet_id == "CAB-EMPTY"
    assert len(model.components) == 0
    assert len(model.wires) == 0
    assert len(model.sources) == 0
