// TypeScript Type Definitions matching FastAPI Backend Models

export type QCStatus = 'PASS' | 'FAIL' | 'REVIEW';
export type MatchStatus = 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS';
export type LifecycleState = 'OPEN' | 'RESOLVED' | 'STILL_OPEN' | 'NEW';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface SourceReference {
  file: string;
  type: 'GA' | 'EXCEL';
  page?: number;
  sheet?: string;
  row?: number;
  reference_detail?: string;
}


export interface DrawingPosition {
  page: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  unit: string;
}

export interface ExpectedComponent {
  tag: string;
  raw_tag: string;
  component_type: string;
  description?: string;
  expected_order?: number;
  expected_label?: string;
  drawing_position?: DrawingPosition;
  source: SourceReference;
  raw_metadata?: Record<string, any>;
}

export interface ExpectedWire {
  wire_id: string;
  source_component: string;
  destination_component: string;
  colour?: string;
  label?: string;
  ferrule?: string;
  terminal?: string;
  source: SourceReference;
}

export interface ExpectedLabel {
  label_id: string;
  text: string;
  raw_text: string;
  component_tag?: string;
  source: SourceReference;
}

export interface ExpectedFerrule {
  ferrule_id: string;
  text: string;
  wire_id?: string;
  terminal_tag?: string;
  source: SourceReference;
}

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'CONFLICT';
  code: string;
  message: string;
  component_tag?: string;
  wire_id?: string;
  source?: SourceReference;
}

export interface ValidationReport {
  status: 'VALID' | 'WARNING' | 'CONFLICT' | 'INCOMPLETE';
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  conflicts: ValidationIssue[];
}

export interface ExpectedCabinetModel {
  cabinet_id: string;
  metadata?: Record<string, any>;
  components: ExpectedComponent[];
  wires: ExpectedWire[];
  labels: ExpectedLabel[];
  ferrules: ExpectedFerrule[];
  validation: ValidationReport;
  sources: SourceReference[];
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ImageMetadata {
  filename: string;
  width: number;
  height: number;
  aspect_ratio: number;
  brightness: number;
  sharpness: number;
  quality_status: 'SUITABLE' | 'WARNING' | 'UNSUITABLE';
  quality_reasons: string[];
}

export interface ObservedComponent {
  detection_id: string;
  component_type: string;
  raw_tag?: string;
  tag?: string;
  confidence: number;
  bounding_box: BoundingBox;
  center_x: number;
  center_y: number;
  row_index?: number;
  col_index?: number;
  crop_path?: string;
  raw_metadata?: Record<string, any>;
}

export interface ObservedLabel {
  label_id: string;
  raw_text: string;
  text: string;
  confidence: number;
  bounding_box: BoundingBox;
  associated_component_id?: string;
}

export interface ObservedFerruleCandidate {
  ferrule_id: string;
  raw_text?: string;
  text?: string;
  confidence: number;
  bounding_box: BoundingBox;
  terminal_tag?: string;
}

export interface ObservedCabinetModel {
  observation_id: string;
  image_metadata: ImageMetadata;
  detected_components: ObservedComponent[];
  detected_labels: ObservedLabel[];
  detected_ferrules: ObservedFerruleCandidate[];
  detector_info: Record<string, any>;
}

export interface MatchResult {
  expected_tag?: string;
  observed_detection_id?: string;
  observed_tag?: string;
  observed_type?: string;
  confidence: number;
  status: MatchStatus;
  signals: Record<string, any>;
  reasoning: string;
}

export interface QCCheck {
  check_id: string;
  rule_id: string;
  rule_name: string;
  status: QCStatus;
  expected_tag?: string;
  observed_detection_id?: string;
  message: string;
  details: Record<string, any>;
  evidence_reference?: Record<string, any>;
}

export interface QCIssue {
  issue_id: string;
  status: QCStatus;
  category: string;
  expected?: string;
  found?: string;
  reason: string;
  confidence_score: number;
  expected_reference?: SourceReference;
  observed_reference?: Record<string, any>;
  rule_id: string;
}

export interface InspectionResult {
  inspection_id: string;
  overall_status: QCStatus;
  summary: {
    total_checks: number;
    pass_count: number;
    fail_count: number;
    review_count: number;
    total_issues?: number;
  };
  matches: MatchResult[];
  checks: QCCheck[];
  issues: QCIssue[];
  expected_model_id: string;
  observation_id: string;
  timestamp: string;
}

export interface EvidenceReference {
  file_name: string;
  relative_path: string;
  url: string;
  mime_type: string;
  width?: number;
  height?: number;
}

export interface EvidenceItem {
  evidence_id: string;
  issue_id: string;
  inspection_id: string;
  rule_id: string;
  issue_status: QCStatus;
  evidence_type: 'ANNOTATED_IMAGE' | 'DEFECT_CROP' | 'EVIDENCE_CARD' | 'COMPARISON_CARD';
  source_image_filename: string;
  bounding_box?: BoundingBox;
  crop_reference?: EvidenceReference;
  annotated_image_reference?: EvidenceReference;
  expected_value: string;
  found_value: string;
  explanation: string;
  created_at: string;
  details: Record<string, any>;
}

export interface EvidenceCollection {
  inspection_id: string;
  annotated_full_image?: EvidenceReference;
  evidence_items: EvidenceItem[];
  generated_at: string;
}

export interface PersistedIssue {
  issue_id: string;
  inspection_id: string;
  rule_id: string;
  category: string;
  expected_value?: string;
  found_value?: string;
  reason: string;
  status: QCStatus;
  lifecycle_state: LifecycleState;
  fingerprint: string;
  bounding_box?: BoundingBox;
  evidence_reference?: EvidenceReference;
  created_at: string;
}

export interface PersistedInspection {
  inspection_id: string;
  cabinet_id: string;
  timestamp: string;
  overall_status: QCStatus;
  summary: Record<string, any>;
  expected_model: ExpectedCabinetModel;
  observed_model: ObservedCabinetModel;
  issues: PersistedIssue[];
}

export interface RecheckSummary {
  previous_failures: number;
  resolved: number;
  still_open: number;
  new: number;
  final_status: QCStatus;
}

export interface RecheckResult {
  comparison_id: string;
  previous_inspection_id: string;
  current_inspection_id: string;
  summary: RecheckSummary;
  resolved_issues: PersistedIssue[];
  still_open_issues: PersistedIssue[];
  new_issues: PersistedIssue[];
  created_at: string;
}
