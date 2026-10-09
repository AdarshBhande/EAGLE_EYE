import {
  HealthResponse,
  ExpectedCabinetModel,
  ObservedCabinetModel,
  InspectionResult,
  EvidenceCollection,
  PersistedInspection,
  PersistedIssue,
  RecheckResult
} from './types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';


export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function parseEngineeringDocuments(
  gaFile?: File,
  excelFile?: File,
  cabinetId?: string
): Promise<ExpectedCabinetModel> {
  const formData = new FormData();
  if (gaFile) formData.append('ga_file', gaFile);
  if (excelFile) formData.append('excel_file', excelFile);
  if (cabinetId) formData.append('cabinet_id', cabinetId);

  const res = await fetch(`${API_BASE_URL}/engineering/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Engineering document parsing failed (${res.status})`);
  }

  return res.json();
}

export async function inspectCabinetImage(imageFile: File): Promise<ObservedCabinetModel> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await fetch(`${API_BASE_URL}/vision/inspect-image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Cabinet image inspection failed (${res.status})`);
  }

  return res.json();
}

export async function evaluateCabinetQC(
  expectedModel: ExpectedCabinetModel,
  observedModel: ObservedCabinetModel
): Promise<InspectionResult> {
  const res = await fetch(`${API_BASE_URL}/qc/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expected_model: expectedModel,
      observed_model: observedModel,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `QC rule evaluation failed (${res.status})`);
  }

  return res.json();
}

export async function generateVisualEvidence(
  inspectionResult: InspectionResult,
  observedModel: ObservedCabinetModel,
  imageFile?: File,
  imageFilename?: string
): Promise<EvidenceCollection> {
  const formData = new FormData();
  const requestPayload = {
    inspection_result: inspectionResult,
    observed_model: observedModel,
    image_filename: imageFilename || observedModel.image_metadata.filename,
  };

  formData.append('request_data', JSON.stringify(requestPayload));
  if (imageFile) {
    formData.append('image_file', imageFile);
  }

  const res = await fetch(`${API_BASE_URL}/evidence/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Visual evidence generation failed (${res.status})`);
  }

  return res.json();
}

export async function persistInspection(
  inspectionResult: InspectionResult,
  expectedModel: ExpectedCabinetModel,
  observedModel: ObservedCabinetModel
): Promise<PersistedInspection> {
  const res = await fetch(`${API_BASE_URL}/inspections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inspection_result: inspectionResult,
      expected_model: expectedModel,
      observed_model: observedModel,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Inspection persistence failed (${res.status})`);
  }

  return res.json();
}

export async function listInspections(): Promise<PersistedInspection[]> {
  const res = await fetch(`${API_BASE_URL}/inspections`);
  if (!res.ok) {
    throw new Error(`Failed to list inspections (${res.status})`);
  }
  return res.json();
}

export async function getInspection(inspectionId: string): Promise<PersistedInspection> {
  const res = await fetch(`${API_BASE_URL}/inspections/${inspectionId}`);
  if (!res.ok) {
    throw new Error(`Inspection '${inspectionId}' not found (${res.status})`);
  }
  return res.json();
}

export async function getInspectionIssues(inspectionId: string): Promise<PersistedIssue[]> {
  const res = await fetch(`${API_BASE_URL}/inspections/${inspectionId}/issues`);
  if (!res.ok) {
    throw new Error(`Failed to fetch issues for inspection '${inspectionId}' (${res.status})`);
  }
  return res.json();
}

export async function performRecheck(
  previousInspectionId: string,
  expectedModel: ExpectedCabinetModel,
  observedModel: ObservedCabinetModel
): Promise<RecheckResult> {
  const res = await fetch(`${API_BASE_URL}/inspections/${previousInspectionId}/recheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expected_model: expectedModel,
      observed_model: observedModel,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Re-check failed (${res.status})`);
  }

  return res.json();
}

export async function getRecheckComparison(comparisonId: string): Promise<RecheckResult> {
  const res = await fetch(`${API_BASE_URL}/rechecks/${comparisonId}`);
  if (!res.ok) {
    throw new Error(`Re-check comparison '${comparisonId}' not found (${res.status})`);
  }
  return res.json();
}

export function getImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
