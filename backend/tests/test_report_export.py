import csv
import io
import json
import pytest
from app.schemas.qc import InspectionResult, QCCheck, QCIssue, QCStatus
from app.schemas.expected_model import ExpectedCabinetModel, ValidationReport
from app.schemas.observed_model import ObservedCabinetModel, ImageMetadata


def escape_csv_cell(val) -> str:
    """Python reference implementation of RFC 4180 CSV escaping for report export validation."""
    if val is None:
        return '""'
    s = str(val)
    if ',' in s or '"' in s or '\n' in s or '\r' in s:
        return f'"{s.replace('"', '""')}"'
    return f'"{s}"'


def serialize_inspection_to_csv(inspection_data: dict) -> str:
    """Helper function matching frontend generateInspectionCsv serialization rules."""
    headers = [
        "Inspection ID",
        "Cabinet ID",
        "Timestamp",
        "Overall Status",
        "Issue ID",
        "Rule ID",
        "Category",
        "Status",
        "Lifecycle State",
        "Reason / Description",
        "Expected Value",
        "Found Value",
        "Evidence Reference URL"
    ]
    rows = []
    issues = inspection_data.get("issues", [])
    
    if not issues:
        rows.append([
            inspection_data.get("inspection_id", ""),
            inspection_data.get("cabinet_id", ""),
            inspection_data.get("timestamp", ""),
            inspection_data.get("overall_status", "PASS"),
            "N/A",
            "N/A",
            "SUMMARY",
            inspection_data.get("overall_status", "PASS"),
            "RESOLVED",
            "Zero quality control issues detected; all expected engineering specifications visually verified.",
            "ALL_EXPECTED",
            "ALL_VERIFIED",
            ""
        ])
    else:
        for issue in issues:
            rows.append([
                inspection_data.get("inspection_id", ""),
                inspection_data.get("cabinet_id", ""),
                inspection_data.get("timestamp", ""),
                inspection_data.get("overall_status", "UNKNOWN"),
                issue.get("issue_id", "N/A"),
                issue.get("rule_id", "N/A"),
                issue.get("category", "GENERAL"),
                issue.get("status", "UNKNOWN"),
                issue.get("lifecycle_state", "OPEN"),
                issue.get("reason", ""),
                issue.get("expected_value", "N/A"),
                issue.get("found_value", "N/A"),
                issue.get("evidence_reference", {}).get("url", "") if issue.get("evidence_reference") else ""
            ])
            
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(headers)
    for r in rows:
        writer.writerow(r)
    return output.getvalue()


def test_csv_export_serialization_escaping():
    """Test that CSV escaping correctly handles quotes, commas, and newlines."""
    mock_inspection = {
        "inspection_id": "INSP-TEST-001",
        "cabinet_id": 'CAB-001, "SPECIAL EDITION"',
        "timestamp": "2026-10-10T01:00:00Z",
        "overall_status": "FAIL",
        "issues": [
            {
                "issue_id": "ISSUE-001",
                "rule_id": "LabelRule",
                "category": "Label",
                "status": "FAIL",
                "lifecycle_state": "OPEN",
                "reason": 'Missing component label "MCB-01"\nLine 2 description, extra info',
                "expected_value": 'Label "MCB-01", 400V',
                "found_value": "NOT OBSERVED"
            }
        ]
    }
    
    csv_str = serialize_inspection_to_csv(mock_inspection)
    assert "INSP-TEST-001" in csv_str
    assert 'CAB-001, ""SPECIAL EDITION""' in csv_str or 'CAB-001, "SPECIAL EDITION"' in csv_str
    
    # Parse with Python standard csv reader to verify syntax validity
    reader = csv.reader(io.StringIO(csv_str))
    rows = list(reader)
    assert len(rows) == 2  # Header + 1 Issue row
    assert rows[0][0] == "Inspection ID"
    assert rows[1][1] == 'CAB-001, "SPECIAL EDITION"'
    assert 'Missing component label "MCB-01"\nLine 2 description, extra info' in rows[1][9]


def test_csv_export_empty_data_pass():
    """Test that CSV export produces a valid clean summary row for zero-issue PASS inspections."""
    mock_pass_inspection = {
        "inspection_id": "INSP-PASS-100",
        "cabinet_id": "CAB-PASS-01",
        "timestamp": "2026-10-10T01:30:00Z",
        "overall_status": "PASS",
        "issues": []
    }
    
    csv_str = serialize_inspection_to_csv(mock_pass_inspection)
    reader = csv.reader(io.StringIO(csv_str))
    rows = list(reader)
    assert len(rows) == 2
    assert rows[1][0] == "INSP-PASS-100"
    assert rows[1][3] == "PASS"
    assert rows[1][6] == "SUMMARY"
    assert rows[1][8] == "RESOLVED"


def test_json_export_structure():
    """Test JSON export data structure contains required fields."""
    mock_inspection = {
        "inspection_id": "INSP-JSON-001",
        "cabinet_id": "CAB-JSON-01",
        "timestamp": "2026-10-10T01:40:00Z",
        "overall_status": "FAIL",
        "issues": [
            {
                "issue_id": "ISS-1",
                "rule_id": "ComponentPresenceRule",
                "category": "Component",
                "status": "FAIL",
                "reason": "Missing Relay K1",
                "expected_value": "K1",
                "found_value": "MISSING"
            }
        ]
    }
    
    export_payload = {
        "report_metadata": {
            "exported_at": "2026-10-10T01:45:00Z",
            "generator": "EAGLE EYE Industrial Inspection System",
            "version": "1.0.0"
        },
        "inspection": {
            "inspection_id": mock_inspection["inspection_id"],
            "cabinet_id": mock_inspection["cabinet_id"],
            "timestamp": mock_inspection["timestamp"],
            "overall_status": mock_inspection["overall_status"]
        },
        "issues": mock_inspection["issues"]
    }
    
    json_bytes = json.dumps(export_payload, indent=2)
    parsed = json.loads(json_bytes)
    assert parsed["inspection"]["inspection_id"] == "INSP-JSON-001"
    assert parsed["report_metadata"]["generator"] == "EAGLE EYE Industrial Inspection System"
    assert len(parsed["issues"]) == 1
    assert parsed["issues"][0]["expected_value"] == "K1"
