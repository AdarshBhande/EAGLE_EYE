import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.parsers.excel_parser import ExcelParser

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_excel_parser_normal():
    excel_path = os.path.join(FIXTURES_DIR, "sample_wire_list.xlsx")
    assert os.path.exists(excel_path), "Fixture sample_wire_list.xlsx must exist"

    parser = ExcelParser(excel_path)
    components, wires, labels, ferrules, metadata = parser.parse()

    assert len(components) == 3
    tags = {c.tag for c in components}
    assert "PS12" in tags
    assert "CB43" in tags
    assert "CB44" in tags

    assert len(wires) == 3
    wire_ids = {w.wire_id for w in wires}
    assert "W01" in wire_ids or "W-01" in wire_ids or "W1" in wire_ids

    # Check traceability
    w1 = wires[0]
    assert w1.source.file == "sample_wire_list.xlsx"
    assert w1.source.type == "EXCEL"
    assert w1.source.sheet == "WireList"
    assert w1.source.row >= 2

    assert metadata["components_found"] == 3
    assert metadata["wires_found"] == 3

def test_excel_parser_file_not_found():
    with pytest.raises(FileNotFoundError):
        parser = ExcelParser("non_existent_wire_list.xlsx")
        parser.parse()
