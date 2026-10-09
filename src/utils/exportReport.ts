import { PersistedInspection, InspectionResult, EvidenceCollection } from '../api/types';

/**
 * Escape a single string field for CSV compliance (RFC 4180).
 * Wraps values containing commas, double quotes, or newlines in double quotes.
 * Internal double quotes are escaped by doubling them ("").
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate CSV string from PersistedInspection or InspectionResult.
 */
export function generateInspectionCsv(
  persisted: PersistedInspection,
  evidenceCollection?: EvidenceCollection,
  inspectionResult?: InspectionResult
): string {
  const headers = [
    'Inspection ID',
    'Cabinet ID',
    'Timestamp',
    'Overall Status',
    'Issue ID',
    'Rule ID',
    'Category',
    'Status',
    'Lifecycle State',
    'Reason / Description',
    'Expected Value',
    'Found Value',
    'Evidence Reference URL'
  ];

  const rows: string[][] = [];
  const issues = persisted.issues || [];

  if (issues.length === 0) {
    // Zero issues case (e.g. PASS)
    rows.push([
      persisted.inspection_id || '',
      persisted.cabinet_id || '',
      persisted.timestamp || new Date().toISOString(),
      persisted.overall_status || 'PASS',
      'N/A',
      'N/A',
      'SUMMARY',
      persisted.overall_status || 'PASS',
      'RESOLVED',
      'Zero quality control issues detected; all expected engineering specifications visually verified.',
      'ALL_EXPECTED',
      'ALL_VERIFIED',
      evidenceCollection?.annotated_full_image?.url || ''
    ]);
  } else {
    issues.forEach(issue => {
      const expVal = issue.expected_value ?? (issue as any).expected ?? 'N/A';
      const foundVal = issue.found_value ?? (issue as any).found ?? 'N/A';
      const evUrl = issue.evidence_reference?.url || evidenceCollection?.annotated_full_image?.url || '';

      rows.push([
        persisted.inspection_id || '',
        persisted.cabinet_id || '',
        persisted.timestamp || new Date().toISOString(),
        persisted.overall_status || 'UNKNOWN',
        issue.issue_id || 'N/A',
        issue.rule_id || 'N/A',
        issue.category || 'GENERAL',
        issue.status || 'UNKNOWN',
        issue.lifecycle_state || 'OPEN',
        issue.reason || '',
        expVal,
        foundVal,
        evUrl
      ]);
    });
  }

  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map(row => row.map(escapeCsvCell).join(','));

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Generate clean structured JSON payload for inspection export.
 */
export function generateInspectionJson(
  persisted: PersistedInspection,
  evidenceCollection?: EvidenceCollection,
  inspectionResult?: InspectionResult
): object {
  return {
    report_metadata: {
      exported_at: new Date().toISOString(),
      generator: 'EAGLE EYE Industrial Inspection System',
      version: '1.0.0'
    },
    inspection: {
      inspection_id: persisted.inspection_id,
      cabinet_id: persisted.cabinet_id,
      timestamp: persisted.timestamp,
      overall_status: persisted.overall_status,
      summary: persisted.summary || {},
    },
    issues: (persisted.issues || []).map(issue => ({
      issue_id: issue.issue_id,
      rule_id: issue.rule_id,
      category: issue.category,
      status: issue.status,
      lifecycle_state: issue.lifecycle_state,
      reason: issue.reason,
      expected_value: issue.expected_value ?? (issue as any).expected ?? null,
      found_value: issue.found_value ?? (issue as any).found ?? null,
      fingerprint: issue.fingerprint,
      bounding_box: issue.bounding_box || null,
      evidence_reference: issue.evidence_reference || null
    })),
    expected_model_summary: persisted.expected_model ? {
      cabinet_id: persisted.expected_model.cabinet_id,
      components_count: persisted.expected_model.components?.length || 0,
      wires_count: persisted.expected_model.wires?.length || 0,
      labels_count: persisted.expected_model.labels?.length || 0,
      ferrules_count: persisted.expected_model.ferrules?.length || 0,
      validation_status: persisted.expected_model.validation?.status || 'UNKNOWN'
    } : null,
    observed_model_summary: persisted.observed_model ? {
      observation_id: persisted.observed_model.observation_id,
      image_filename: persisted.observed_model.image_metadata?.filename,
      quality_status: persisted.observed_model.image_metadata?.quality_status,
      detected_components_count: persisted.observed_model.detected_components?.length || 0,
      detected_labels_count: persisted.observed_model.detected_labels?.length || 0
    } : null,
    evidence_summary: evidenceCollection ? {
      annotated_image_url: evidenceCollection.annotated_full_image?.url || null,
      items_count: evidenceCollection.evidence_items?.length || 0
    } : null
  };
}

/**
 * Triggers a browser download of a generated blob.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInspectionAsCsv(
  persisted: PersistedInspection,
  evidenceCollection?: EvidenceCollection,
  inspectionResult?: InspectionResult
): void {
  const csvContent = generateInspectionCsv(persisted, evidenceCollection, inspectionResult);
  const filename = `eagle_eye_inspection_${persisted.inspection_id}_report.csv`;
  downloadFile(csvContent, filename, 'text/csv');
}

export function exportInspectionAsJson(
  persisted: PersistedInspection,
  evidenceCollection?: EvidenceCollection,
  inspectionResult?: InspectionResult
): void {
  const jsonData = generateInspectionJson(persisted, evidenceCollection, inspectionResult);
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const filename = `eagle_eye_inspection_${persisted.inspection_id}_report.json`;
  downloadFile(jsonContent, filename, 'application/json');
}
