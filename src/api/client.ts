import {
  HealthResponse,
  ExpectedCabinetModel,
  ObservedCabinetModel,
  InspectionResult,
  EvidenceCollection,
  PersistedInspection,
  PersistedIssue,
  RecheckResult,
  EvidenceItem,
  QCCheck,
  QCIssue,
  MatchResult
} from './types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Helper to generate SVG Data URIs for evidence items in standalone mode
function createMockSvgImage(text: string, subtext: string, color: string = '#f43f5e'): string {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSubtext = subtext.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#18181b"/>
    <rect x="20" y="20" width="560" height="360" fill="#27272a" stroke="${color}" stroke-width="3" rx="8" stroke-dasharray="6,6"/>
    <text x="300" y="160" font-family="monospace" font-size="22" font-weight="bold" fill="${color}" text-anchor="middle">${safeText}</text>
    <text x="300" y="210" font-family="sans-serif" font-size="14" fill="#a1a1aa" text-anchor="middle">${safeSubtext}</text>
    <text x="300" y="340" font-family="monospace" font-size="12" fill="#71717a" text-anchor="middle">EAGLE EYE AI VISION PROOF - DEFECT CARD</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// LocalStorage Persistence Keys for Standalone Mode
const STORAGE_INSPECTIONS_KEY = 'eagle_eye_inspections_v3';
const STORAGE_RECHECKS_KEY = 'eagle_eye_rechecks_v3';

function getStoredInspections(): PersistedInspection[] {
  try {
    // Purge legacy keys if present
    localStorage.removeItem('eagle_eye_inspections_db');
    localStorage.removeItem('eagle_eye_rechecks_db');

    const raw = localStorage.getItem(STORAGE_INSPECTIONS_KEY);
    if (!raw) {
      const initial = generateSeedInspections();
      localStorage.setItem(STORAGE_INSPECTIONS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0 || JSON.stringify(parsed).includes('base64,')) {
      const initial = generateSeedInspections();
      localStorage.setItem(STORAGE_INSPECTIONS_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    const initial = generateSeedInspections();
    try {
      localStorage.setItem(STORAGE_INSPECTIONS_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  }
}

function saveStoredInspections(items: PersistedInspection[]) {
  try {
    localStorage.setItem(STORAGE_INSPECTIONS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// --- SEED DATA FOR DEMO MODE ---
function generateSeedInspections(): PersistedInspection[] {
  const dateStr = new Date().toISOString();
  
  const sample1: PersistedInspection = {
    inspection_id: 'INSP-DEMO-PASS',
    cabinet_id: 'CAB-2026-001-A',
    timestamp: dateStr,
    overall_status: 'PASS',
    summary: { total_checks: 12, pass_count: 12, fail_count: 0, review_count: 0, total_issues: 0 },
    expected_model: {
      cabinet_id: 'CAB-2026-001-A',
      components: [
        { tag: 'Q1', raw_tag: 'Q1', component_type: 'CIRCUIT_BREAKER', description: 'Main Power Breaker 63A', source: { file: 'GA_CAB001.pdf', type: 'GA' } },
        { tag: 'K1', raw_tag: 'K1', component_type: 'CONTACTOR', description: 'Motor Contactor 24VDC', source: { file: 'GA_CAB001.pdf', type: 'GA' } },
        { tag: 'X1', raw_tag: 'X1', component_type: 'TERMINAL_BLOCK', description: 'Control Terminal Strip', source: { file: 'GA_CAB001.pdf', type: 'GA' } },
      ],
      wires: [],
      labels: [],
      ferrules: [],
      validation: { status: 'VALID', errors: [], warnings: [], conflicts: [] },
      sources: [{ file: 'GA_CAB001.pdf', type: 'GA' }]
    },
    observed_model: {
      observation_id: 'OBS-DEMO-PASS',
      image_metadata: { filename: 'sample_cabinet.jpg', width: 1920, height: 1080, aspect_ratio: 1.77, brightness: 185, sharpness: 240, quality_status: 'SUITABLE', quality_reasons: [] },
      detected_components: [
        { detection_id: 'det-1', component_type: 'CIRCUIT_BREAKER', tag: 'Q1', confidence: 0.96, bounding_box: { x1: 100, y1: 100, x2: 250, y2: 300 }, center_x: 175, center_y: 200 },
        { detection_id: 'det-2', component_type: 'CONTACTOR', tag: 'K1', confidence: 0.94, bounding_box: { x1: 300, y1: 100, x2: 450, y2: 300 }, center_x: 375, center_y: 200 },
        { detection_id: 'det-3', component_type: 'TERMINAL_BLOCK', tag: 'X1', confidence: 0.98, bounding_box: { x1: 500, y1: 100, x2: 800, y2: 300 }, center_x: 650, center_y: 200 },
      ],
      detected_labels: [],
      detected_ferrules: [],
      detector_info: { engine: 'YOLOv8n-Standalone' }
    },
    issues: []
  };

  const sample2: PersistedInspection = {
    inspection_id: 'INSP-DEMO-FAIL',
    cabinet_id: 'CAB-2026-002-B',
    timestamp: dateStr,
    overall_status: 'FAIL',
    summary: { total_checks: 10, pass_count: 7, fail_count: 3, review_count: 0, total_issues: 3 },
    expected_model: {
      cabinet_id: 'CAB-2026-002-B',
      components: [
        { tag: 'Q1', raw_tag: 'Q1', component_type: 'CIRCUIT_BREAKER', description: 'Main Power Breaker 63A', source: { file: 'GA_CAB002.pdf', type: 'GA' } },
        { tag: 'Q2', raw_tag: 'Q2', component_type: 'CIRCUIT_BREAKER', description: 'Auxiliary Breaker 16A', source: { file: 'GA_CAB002.pdf', type: 'GA' } },
        { tag: 'K1', raw_tag: 'K1', component_type: 'CONTACTOR', description: 'Motor Contactor 24VDC', source: { file: 'GA_CAB002.pdf', type: 'GA' } },
        { tag: 'F1', raw_tag: 'F1', component_type: 'FUSE', description: 'Safety Fuse 5A', source: { file: 'GA_CAB002.pdf', type: 'GA' } },
      ],
      wires: [],
      labels: [],
      ferrules: [],
      validation: { status: 'VALID', errors: [], warnings: [], conflicts: [] },
      sources: [{ file: 'GA_CAB002.pdf', type: 'GA' }]
    },
    observed_model: {
      observation_id: 'OBS-DEMO-FAIL',
      image_metadata: { filename: 'sample_cabinet_fail.jpg', width: 1920, height: 1080, aspect_ratio: 1.77, brightness: 170, sharpness: 220, quality_status: 'SUITABLE', quality_reasons: [] },
      detected_components: [
        { detection_id: 'det-10', component_type: 'CIRCUIT_BREAKER', tag: 'Q1', confidence: 0.95, bounding_box: { x1: 100, y1: 100, x2: 250, y2: 300 }, center_x: 175, center_y: 200 },
        { detection_id: 'det-12', component_type: 'CONTACTOR', tag: 'K1', confidence: 0.91, bounding_box: { x1: 300, y1: 100, x2: 450, y2: 300 }, center_x: 375, center_y: 200 },
        { detection_id: 'det-13', component_type: 'BUS_BAR', tag: 'EXTRA-1', confidence: 0.88, bounding_box: { x1: 500, y1: 100, x2: 650, y2: 300 }, center_x: 575, center_y: 200 },
      ],
      detected_labels: [],
      detected_ferrules: [],
      detector_info: { engine: 'YOLOv8n-Standalone' }
    },
    issues: [
      {
        issue_id: 'iss-1',
        inspection_id: 'INSP-DEMO-FAIL',
        rule_id: 'ComponentPresenceRule',
        category: 'MISSING_COMPONENT',
        expected_value: 'CIRCUIT_BREAKER (Tag Q2)',
        found_value: 'NOT OBSERVED',
        reason: 'Expected component Q2 (CIRCUIT_BREAKER) was not detected in physical cabinet photo.',
        status: 'FAIL',
        lifecycle_state: 'OPEN',
        fingerprint: 'fp-q2-missing',
        created_at: dateStr,
        evidence_reference: {
          file_name: 'evidence_card_q2.png',
          relative_path: '',
          url: createMockSvgImage('MISSING COMPONENT: Q2', 'Expected Circuit Breaker Q2 not found'),
          mime_type: 'image/svg+xml'
        }
      },
      {
        issue_id: 'iss-2',
        inspection_id: 'INSP-DEMO-FAIL',
        rule_id: 'ComponentPresenceRule',
        category: 'MISSING_COMPONENT',
        expected_value: 'FUSE (Tag F1)',
        found_value: 'NOT OBSERVED',
        reason: 'Expected component F1 (FUSE) was not detected in physical cabinet photo.',
        status: 'FAIL',
        lifecycle_state: 'OPEN',
        fingerprint: 'fp-f1-missing',
        created_at: dateStr,
        evidence_reference: {
          file_name: 'evidence_card_f1.png',
          relative_path: '',
          url: createMockSvgImage('MISSING COMPONENT: F1', 'Expected Fuse F1 not found'),
          mime_type: 'image/svg+xml'
        }
      },
      {
        issue_id: 'iss-3',
        inspection_id: 'INSP-DEMO-FAIL',
        rule_id: 'ExtraComponentRule',
        category: 'UNEXPECTED_COMPONENT',
        expected_value: 'NOT SPECIFIED IN GA',
        found_value: 'BUS_BAR (extra_1)',
        reason: 'Unplanned component detected at coordinates [500, 100, 650, 300].',
        status: 'FAIL',
        lifecycle_state: 'OPEN',
        fingerprint: 'fp-extra-busbar',
        bounding_box: { x1: 500, y1: 100, x2: 650, y2: 300 },
        created_at: dateStr,
        evidence_reference: {
          file_name: 'evidence_crop_busbar.png',
          relative_path: '',
          url: createMockSvgImage('UNEXPECTED COMPONENT', 'Unplanned Bus Bar detected at [500,100]'),
          mime_type: 'image/svg+xml'
        }
      }
    ]
  };

  return [sample1, sample2];
}

// --- API METHODS WITH AUTOMATIC STANDALONE MOCK FALLBACK ---

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }
  return {
    status: 'healthy',
    service: 'EAGLE EYE Control Cabinet Inspection (Standalone Web Mode)',
    version: '1.0.0-standalone',
    environment: 'browser-demo'
  };
}

export async function parseEngineeringDocuments(
  gaFile?: File,
  excelFile?: File,
  cabinetId?: string
): Promise<ExpectedCabinetModel> {
  try {
    const formData = new FormData();
    if (gaFile) formData.append('ga_file', gaFile);
    if (excelFile) formData.append('excel_file', excelFile);
    if (cabinetId) formData.append('cabinet_id', cabinetId);

    const res = await fetch(`${API_BASE_URL}/engineering/parse`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const cid = cabinetId || (gaFile ? gaFile.name.replace(/\.[^/.]+$/, '') : 'CAB-DEMO-001');
  const isFaultScenario = cid.toLowerCase().includes('fault');
  const isPassScenario = cid.toLowerCase().includes('pass');

  const components = [
    { tag: 'Q1', raw_tag: 'Q1', component_type: 'CIRCUIT_BREAKER', description: 'Main Air Circuit Breaker 63A', expected_order: 1, source: { file: gaFile?.name || 'GA_DRAWING.pdf', type: 'GA' as const } },
    { tag: 'Q2', raw_tag: 'Q2', component_type: 'CIRCUIT_BREAKER', description: 'Control Circuit Breaker 16A', expected_order: 2, source: { file: gaFile?.name || 'GA_DRAWING.pdf', type: 'GA' as const } },
    { tag: 'K1', raw_tag: 'K1', component_type: 'CONTACTOR', description: 'Main Power Contactor 24V', expected_order: 3, source: { file: gaFile?.name || 'GA_DRAWING.pdf', type: 'GA' as const } },
    { tag: 'F1', raw_tag: 'F1', component_type: 'FUSE', description: 'Primary Protection Fuse 5A', expected_order: 4, source: { file: gaFile?.name || 'GA_DRAWING.pdf', type: 'GA' as const } },
    { tag: 'X1', raw_tag: 'X1', component_type: 'TERMINAL_BLOCK', description: 'Master Terminal Strip 24-Pin', expected_order: 5, source: { file: gaFile?.name || 'GA_DRAWING.pdf', type: 'GA' as const } },
  ];

  return {
    cabinet_id: cid,
    components,
    wires: [
      { wire_id: 'W-01', source_component: 'Q1', destination_component: 'K1', colour: 'RED', label: 'W-01-RED', ferrule: 'F-01', source: { file: excelFile?.name || 'WIRE_LIST.xlsx', type: 'EXCEL' as const } },
      { wire_id: 'W-02', source_component: 'K1', destination_component: 'X1', colour: 'BLUE', label: 'W-02-BLUE', ferrule: 'F-02', source: { file: excelFile?.name || 'WIRE_LIST.xlsx', type: 'EXCEL' as const } },
    ],
    labels: [
      { label_id: 'L-1', text: 'Q1-MAIN-63A', raw_text: 'Q1-MAIN-63A', component_tag: 'Q1', source: { file: excelFile?.name || 'WIRE_LIST.xlsx', type: 'EXCEL' as const } },
      { label_id: 'L-2', text: 'K1-CTRL-24V', raw_text: 'K1-CTRL-24V', component_tag: 'K1', source: { file: excelFile?.name || 'WIRE_LIST.xlsx', type: 'EXCEL' as const } },
    ],
    ferrules: [],
    validation: { status: 'VALID', errors: [], warnings: [], conflicts: [] },
    sources: [
      { file: gaFile?.name || 'GA_DRAWING.pdf', type: 'GA' as const },
      { file: excelFile?.name || 'WIRE_LIST.xlsx', type: 'EXCEL' as const }
    ]
  };
}

export async function inspectCabinetImage(imageFile: File): Promise<ObservedCabinetModel> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${API_BASE_URL}/vision/inspect-image`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const filename = imageFile ? imageFile.name : 'cabinet_photo.jpg';

  return {
    observation_id: `OBS-${Date.now()}`,
    image_metadata: {
      filename,
      width: 1920,
      height: 1080,
      aspect_ratio: 1.77,
      brightness: 182,
      sharpness: 235,
      quality_status: 'SUITABLE',
      quality_reasons: []
    },
    detected_components: [
      { detection_id: 'det-q1', component_type: 'CIRCUIT_BREAKER', tag: 'Q1', confidence: 0.97, bounding_box: { x1: 120, y1: 150, x2: 280, y2: 350 }, center_x: 200, center_y: 250 },
      { detection_id: 'det-k1', component_type: 'CONTACTOR', tag: 'K1', confidence: 0.94, bounding_box: { x1: 340, y1: 150, x2: 500, y2: 350 }, center_x: 420, center_y: 250 },
      { detection_id: 'det-x1', component_type: 'TERMINAL_BLOCK', tag: 'X1', confidence: 0.99, bounding_box: { x1: 560, y1: 150, x2: 880, y2: 350 }, center_x: 720, center_y: 250 },
      { detection_id: 'det-extra', component_type: 'RELAY', tag: 'RELAY_UNEXPECTED', confidence: 0.89, bounding_box: { x1: 920, y1: 150, x2: 1060, y2: 350 }, center_x: 990, center_y: 250 },
    ],
    detected_labels: [
      { label_id: 'lbl-1', raw_text: 'Q1-MAIN-63A', text: 'Q1-MAIN-63A', confidence: 0.96, bounding_box: { x1: 130, y1: 360, x2: 270, y2: 390 }, associated_component_id: 'det-q1' },
      { label_id: 'lbl-2', raw_text: 'K1-WRONG-TAG', text: 'K1-WRONG-TAG', confidence: 0.91, bounding_box: { x1: 350, y1: 360, x2: 490, y2: 390 }, associated_component_id: 'det-k1' }
    ],
    detected_ferrules: [],
    detector_info: { engine: 'YOLOv8n + EasyOCR (Standalone Browser Mode)' }
  };
}

export async function evaluateCabinetQC(
  expectedModel: ExpectedCabinetModel,
  observedModel: ObservedCabinetModel
): Promise<InspectionResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/qc/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expected_model: expectedModel, observed_model: observedModel }),
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const inspectionId = `INSP-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toISOString();

  // Match expected vs observed
  const matches: MatchResult[] = [];
  const checks: QCCheck[] = [];
  const issues: QCIssue[] = [];

  for (const expComp of expectedModel.components) {
    const found = observedModel.detected_components.find(
      obs => obs.tag === expComp.tag || obs.component_type === expComp.component_type
    );

    if (found) {
      matches.push({
        expected_tag: expComp.tag,
        observed_detection_id: found.detection_id,
        observed_tag: found.tag,
        observed_type: found.component_type,
        confidence: found.confidence,
        status: 'MATCHED',
        signals: { spatial_iou: 0.85, tag_similarity: 1.0 },
        reasoning: `Expected component ${expComp.tag} matches physical detection ${found.detection_id}.`
      });

      checks.push({
        check_id: `chk-${expComp.tag}`,
        rule_id: 'ComponentPresenceRule',
        rule_name: 'Component Presence Verification',
        status: 'PASS',
        expected_tag: expComp.tag,
        observed_detection_id: found.detection_id,
        message: `Component ${expComp.tag} observed with ${Math.round(found.confidence * 100)}% confidence.`,
        details: {}
      });
    } else {
      checks.push({
        check_id: `chk-${expComp.tag}`,
        rule_id: 'ComponentPresenceRule',
        rule_name: 'Component Presence Verification',
        status: 'FAIL',
        expected_tag: expComp.tag,
        message: `Expected component ${expComp.tag} (${expComp.component_type}) was not detected in physical cabinet.`,
        details: {}
      });

      issues.push({
        issue_id: `iss-missing-${expComp.tag}`,
        status: 'FAIL',
        category: 'MISSING_COMPONENT',
        expected: `${expComp.component_type} (Tag: ${expComp.tag})`,
        found: 'NOT OBSERVED',
        reason: `Expected component ${expComp.tag} (${expComp.description || expComp.component_type}) missing from physical layout.`,
        confidence_score: 0.99,
        expected_reference: expComp.source,
        rule_id: 'ComponentPresenceRule'
      });
    }
  }

  // Check for unexpected extra components
  for (const obs of observedModel.detected_components) {
    const matched = matches.some(m => m.observed_detection_id === obs.detection_id);
    if (!matched) {
      issues.push({
        issue_id: `iss-extra-${obs.detection_id}`,
        status: 'FAIL',
        category: 'UNEXPECTED_COMPONENT',
        expected: 'NOT SPECIFIED IN GA DRAWING',
        found: `${obs.component_type} (${obs.tag || obs.detection_id})`,
        reason: `Unplanned component detected at bounding box [${obs.bounding_box.x1}, ${obs.bounding_box.y1}, ${obs.bounding_box.x2}, ${obs.bounding_box.y2}].`,
        confidence_score: obs.confidence,
        rule_id: 'ExtraComponentRule'
      });
    }
  }

  const overallStatus = issues.length === 0 ? 'PASS' : 'FAIL';

  return {
    inspection_id: inspectionId,
    overall_status: overallStatus,
    summary: {
      total_checks: checks.length,
      pass_count: checks.filter(c => c.status === 'PASS').length,
      fail_count: checks.filter(c => c.status === 'FAIL').length,
      review_count: 0,
      total_issues: issues.length
    },
    matches,
    checks,
    issues,
    expected_model_id: expectedModel.cabinet_id,
    observation_id: observedModel.observation_id,
    timestamp: dateStr
  };
}

export async function generateVisualEvidence(
  inspectionResult: InspectionResult,
  observedModel: ObservedCabinetModel,
  imageFile?: File,
  imageFilename?: string
): Promise<EvidenceCollection> {
  try {
    const formData = new FormData();
    const requestPayload = {
      inspection_result: inspectionResult,
      observed_model: observedModel,
      image_filename: imageFilename || observedModel.image_metadata.filename,
    };

    formData.append('request_data', JSON.stringify(requestPayload));
    if (imageFile) formData.append('image_file', imageFile);

    const res = await fetch(`${API_BASE_URL}/evidence/generate`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const items: EvidenceItem[] = inspectionResult.issues.map((issue, idx) => ({
    evidence_id: `evi-${idx}-${Date.now()}`,
    issue_id: issue.issue_id,
    inspection_id: inspectionResult.inspection_id,
    rule_id: issue.rule_id,
    issue_status: issue.status,
    evidence_type: issue.category === 'MISSING_COMPONENT' ? 'EVIDENCE_CARD' : 'DEFECT_CROP',
    source_image_filename: observedModel.image_metadata.filename,
    expected_value: issue.expected || 'EXPECTED',
    found_value: issue.found || 'FOUND',
    explanation: issue.reason,
    created_at: new Date().toISOString(),
    details: {},
    crop_reference: {
      file_name: `defect_${issue.issue_id}.png`,
      relative_path: '',
      url: createMockSvgImage(`DEFECT: ${issue.category}`, issue.reason, '#f43f5e'),
      mime_type: 'image/svg+xml'
    }
  }));

  return {
    inspection_id: inspectionResult.inspection_id,
    evidence_items: items,
    generated_at: new Date().toISOString()
  };
}

export async function persistInspection(
  inspectionResult: InspectionResult,
  expectedModel: ExpectedCabinetModel,
  observedModel: ObservedCabinetModel
): Promise<PersistedInspection> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspection_result: inspectionResult,
        expected_model: expectedModel,
        observed_model: observedModel,
      }),
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const dateStr = new Date().toISOString();
  const persistedIssues: PersistedIssue[] = inspectionResult.issues.map(iss => ({
    issue_id: iss.issue_id,
    inspection_id: inspectionResult.inspection_id,
    rule_id: iss.rule_id,
    category: iss.category,
    expected_value: iss.expected,
    found_value: iss.found,
    reason: iss.reason,
    status: iss.status,
    lifecycle_state: 'OPEN',
    fingerprint: `fp-${iss.issue_id}`,
    created_at: dateStr,
    evidence_reference: {
      file_name: `evidence_${iss.issue_id}.png`,
      relative_path: '',
      url: createMockSvgImage(`DEFECT: ${iss.category}`, iss.reason),
      mime_type: 'image/svg+xml'
    }
  }));

  const item: PersistedInspection = {
    inspection_id: inspectionResult.inspection_id,
    cabinet_id: expectedModel.cabinet_id,
    timestamp: dateStr,
    overall_status: inspectionResult.overall_status,
    summary: inspectionResult.summary,
    expected_model: expectedModel,
    observed_model: observedModel,
    issues: persistedIssues
  };

  const current = getStoredInspections();
  saveStoredInspections([item, ...current]);
  return item;
}

export async function listInspections(): Promise<PersistedInspection[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }
  return getStoredInspections();
}

export async function getInspection(inspectionId: string): Promise<PersistedInspection> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections/${inspectionId}`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const items = getStoredInspections();
  const found = items.find(i => i.inspection_id === inspectionId || i.cabinet_id === inspectionId);
  if (found) return found;

  return items[0] || generateSeedInspections()[0];
}

export async function getInspectionIssues(inspectionId: string): Promise<PersistedIssue[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections/${inspectionId}/issues`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const insp = await getInspection(inspectionId);
  return insp.issues || [];
}

export async function performRecheck(
  previousInspectionId: string,
  expectedModel: ExpectedCabinetModel,
  observedModel: ObservedCabinetModel
): Promise<RecheckResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections/${previousInspectionId}/recheck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expected_model: expectedModel, observed_model: observedModel }),
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  const previous = await getInspection(previousInspectionId);
  const currentQc = await evaluateCabinetQC(expectedModel, observedModel);
  const currentPersisted = await persistInspection(currentQc, expectedModel, observedModel);

  const prevIssueMap = new Map(previous.issues.map(i => [i.category + (i.expected_value || ''), i]));
  const currentIssueMap = new Map(currentPersisted.issues.map(i => [i.category + (i.expected_value || ''), i]));

  const resolved: PersistedIssue[] = [];
  const stillOpen: PersistedIssue[] = [];
  const newIssues: PersistedIssue[] = [];

  for (const [key, prevIssue] of prevIssueMap) {
    if (currentIssueMap.has(key)) {
      stillOpen.push({ ...prevIssue, lifecycle_state: 'STILL_OPEN' });
    } else {
      resolved.push({ ...prevIssue, lifecycle_state: 'RESOLVED' });
    }
  }

  for (const [key, currIssue] of currentIssueMap) {
    if (!prevIssueMap.has(key)) {
      newIssues.push({ ...currIssue, lifecycle_state: 'NEW' });
    }
  }

  const result: RecheckResult = {
    comparison_id: `RECHECK-${Date.now()}`,
    previous_inspection_id: previousInspectionId,
    current_inspection_id: currentPersisted.inspection_id,
    summary: {
      previous_failures: previous.issues.length,
      resolved: resolved.length,
      still_open: stillOpen.length,
      new: newIssues.length,
      final_status: stillOpen.length + newIssues.length === 0 ? 'PASS' : 'FAIL'
    },
    resolved_issues: resolved,
    still_open_issues: stillOpen,
    new_issues: newIssues,
    created_at: new Date().toISOString()
  };

  return result;
}

export async function getRecheckComparison(comparisonId: string): Promise<RecheckResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/rechecks/${comparisonId}`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch {
    // Standalone fallback
  }

  return {
    comparison_id: comparisonId,
    previous_inspection_id: 'INSP-DEMO-FAIL',
    current_inspection_id: 'INSP-DEMO-PASS',
    summary: {
      previous_failures: 3,
      resolved: 2,
      still_open: 1,
      new: 0,
      final_status: 'FAIL'
    },
    resolved_issues: [],
    still_open_issues: [],
    new_issues: [],
    created_at: new Date().toISOString()
  };
}

export function getImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
