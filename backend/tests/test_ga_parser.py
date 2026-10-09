import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.parsers.ga_parser import GAParser

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_ga_parser_readable_pdf():
    pdf_path = os.path.join(FIXTURES_DIR, "sample_ga.pdf")
    assert os.path.exists(pdf_path), "Fixture sample_ga.pdf must exist"

    parser = GAParser(pdf_path)
    components, metadata = parser.parse()

    assert len(components) >= 4
    tags = {c.tag for c in components}
    assert "PS12" in tags
    assert "CB43" in tags
    assert "CB44" in tags
    assert "1CBP03" in tags
    assert "X3" in tags

    # Check traceability & drawing position
    ps12 = next(c for c in components if c.tag == "PS12")
    assert ps12.source.file == "sample_ga.pdf"
    assert ps12.source.type == "GA"
    assert ps12.source.page == 1
    assert ps12.drawing_position is not None
    assert ps12.drawing_position.page == 1
    assert ps12.drawing_position.x_min >= 0

    assert metadata["is_scanned_pdf"] is False
    assert metadata["pages_processed"] == 1

def test_ga_parser_scanned_pdf():
    pdf_path = os.path.join(FIXTURES_DIR, "scanned_ga.pdf")
    assert os.path.exists(pdf_path)

    parser = GAParser(pdf_path)
    components, metadata = parser.parse()

    assert metadata["is_scanned_pdf"] is True
    assert metadata["has_extractable_text"] is False

def test_ga_parser_file_not_found():
    with pytest.raises(FileNotFoundError):
        parser = GAParser("non_existent_file.pdf")
        parser.parse()
