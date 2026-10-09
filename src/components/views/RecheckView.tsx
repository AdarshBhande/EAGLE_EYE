import React, { useEffect, useState } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  FileCheck2, 
  Eye, 
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Layers,
  Filter,
  Check,
  Zap
} from 'lucide-react';
import { 
  RecheckResult, 
  PersistedInspection, 
  PersistedIssue, 
  LifecycleState 
} from '../../api/types';
import { 
  getImageUrl, 
  listInspections, 
  getInspection, 
  inspectCabinetImage, 
  performRecheck 
} from '../../api/client';

interface RecheckViewProps {
  initialInspectionId?: string | null;
  initialRecheckResult?: RecheckResult | null;
  onBackToHistory: () => void;
}

export function RecheckView({ 
  initialInspectionId, 
  initialRecheckResult, 
  onBackToHistory 
}: RecheckViewProps) {
  // Stored inspections list & selected inspection
  const [storedInspections, setStoredInspections] = useState<PersistedInspection[]>([]);
  const [loadingInspections, setLoadingInspections] = useState<boolean>(true);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(initialInspectionId || '');
  const [selectedInspection, setSelectedInspection] = useState<PersistedInspection | null>(null);

  // Corrected Photo Upload State
  const [correctedPhoto, setCorrectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Validation & Execution State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionMsg, setSubmissionMsg] = useState<string>('');

  // Results State
  const [recheckResult, setRecheckResult] = useState<RecheckResult | null>(initialRecheckResult || null);
  const [filterState, setFilterState] = useState<'ALL' | 'RESOLVED' | 'STILL_OPEN' | 'NEW'>('ALL');

  // Load inspection history list on mount
  useEffect(() => {
    loadInspectionsList();
  }, []);

  // Sync initialInspectionId prop change
  useEffect(() => {
    if (initialInspectionId) {
      setSelectedInspectionId(initialInspectionId);
      loadSingleInspection(initialInspectionId);
    }
  }, [initialInspectionId]);

  // Sync initialRecheckResult prop change
  useEffect(() => {
    if (initialRecheckResult) {
      setRecheckResult(initialRecheckResult);
    }
  }, [initialRecheckResult]);

  const loadInspectionsList = async () => {
    setLoadingInspections(true);
    try {
      const data = await listInspections();
      setStoredInspections(data);
      if (!selectedInspectionId && data.length > 0) {
        // Default to first non-PASS inspection if available, or first inspection
        const firstFailed = data.find(i => i.overall_status !== 'PASS') || data[0];
        setSelectedInspectionId(firstFailed.inspection_id);
        loadSingleInspection(firstFailed.inspection_id);
      }
    } catch (err: any) {
      console.error("Error loading inspections list:", err);
    } finally {
      setLoadingInspections(false);
    }
  };

  const loadSingleInspection = async (id: string) => {
    if (!id) return;
    try {
      const ins = await getInspection(id);
      setSelectedInspection(ins);
    } catch (err: any) {
      console.error(`Error loading inspection ${id}:`, err);
    }
  };

  const handleSelectInspectionChange = (id: string) => {
    setSelectedInspectionId(id);
    setRecheckResult(null);
    setApiError(null);
    loadSingleInspection(id);
  };

  // Client-side File Validation
  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    setApiError(null);

    // Validate MIME type / extension
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const lowerName = file.name.toLowerCase();
    const isValidExtension = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');

    if (!validTypes.includes(file.type) && !isValidExtension) {
      setValidationError("Invalid file format. Please upload a JPG or PNG cabinet photograph.");
      return;
    }

    // Validate file size (max 10 MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError(`File size exceeds 10 MB maximum limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    // Format size string
    const formattedSize = file.size < 1024 * 1024 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    setFileSizeFormatted(formattedSize);

    // Preview URL & dimensions
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(previewUrl);
    setCorrectedPhoto(file);

    const img = new Image();
    img.onload = () => {
      setFileDimensions({ width: img.width, height: img.height });
    };
    img.src = previewUrl;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setCorrectedPhoto(null);
    setPhotoPreviewUrl(null);
    setFileSizeFormatted('');
    setFileDimensions(null);
    setValidationError(null);
  };

  // Re-check Pipeline Execution Handler
  const handleExecuteRecheck = async () => {
    if (!selectedInspectionId || !selectedInspection || !correctedPhoto) {
      setValidationError("Please select an inspection record and upload a valid corrected cabinet photo.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Step 1: Run Computer Vision Pipeline on corrected photograph
      setSubmissionMsg("1/2 Inspecting corrected photograph through Computer Vision Pipeline...");
      const newObservedModel = await inspectCabinetImage(correctedPhoto);

      // Step 2: Run Re-check lifecycle comparison against expected model
      setSubmissionMsg(`2/2 Executing differential re-check against previous inspection #${selectedInspectionId}...`);
      const result = await performRecheck(
        selectedInspectionId,
        selectedInspection.expected_model,
        newObservedModel
      );

      setRecheckResult(result);
    } catch (err: any) {
      setApiError(err.message || "Re-check execution failed. Please ensure FastAPI backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  // RENDER MODE 2: RE-CHECK COMPARISON RESULTS VIEW
  // -------------------------------------------------------------------
  if (recheckResult) {
    const { summary } = recheckResult;
    const statusColor = summary.final_status === 'PASS' ? '#10b981' : summary.final_status === 'FAIL' ? '#ef4444' : '#eab308';
    const statusBg = summary.final_status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : summary.final_status === 'FAIL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)';

    const allIssues = [
      ...recheckResult.resolved_issues,
      ...recheckResult.still_open_issues,
      ...recheckResult.new_issues
    ];

    const filteredIssues = allIssues.filter(issue => {
      if (filterState === 'RESOLVED') return issue.lifecycle_state === 'RESOLVED';
      if (filterState === 'STILL_OPEN') return issue.lifecycle_state === 'STILL_OPEN';
      if (filterState === 'NEW') return issue.lifecycle_state === 'NEW';
      return true;
    });

    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Banner */}
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#161616',
          borderRadius: '8px',
          border: `1px solid ${statusColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <RotateCcw size={18} color="#06b6d4" />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#06b6d4', fontWeight: 600 }}>RE-CHECK LIFECYCLE EVALUATION RESULT</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Re-Check Comparison #{recheckResult.comparison_id}
            </h1>
            <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px', margin: 0 }}>
              Previous Inspection <code style={{ color: '#ffffff' }}>{recheckResult.previous_inspection_id}</code> vs Post-Fix Re-Check <code style={{ color: '#ffffff' }}>{recheckResult.current_inspection_id}</code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setRecheckResult(null)}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#1b1b1b',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#06b6d4',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Upload size={15} /> Upload Another Photo
            </button>

            <button
              onClick={onBackToHistory}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: '#1b1b1b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Back to History
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>PREVIOUS FAILURES</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>{summary.previous_failures}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Original Defects</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>RESOLVED DEFECTS</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{summary.resolved}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Verified Fixed by Backend</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#ef4444', fontFamily: 'monospace', fontWeight: 600 }}>STILL OPEN</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{summary.still_open}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Persisting Defects</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#eab308', fontFamily: 'monospace', fontWeight: 600 }}>NEW DEFECTS</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#eab308', marginTop: '4px' }}>{summary.new}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Introduced in Re-check</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: `1px solid ${statusColor}` }}>
            <div style={{ fontSize: '11px', color: statusColor, fontFamily: 'monospace', fontWeight: 600 }}>FINAL QC VERDICT</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: statusColor, marginTop: '4px' }}>{summary.final_status}</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Calculated by Rule Engine</div>
          </div>
        </div>

        {/* Filter Bar & Issue Breakdown */}
        <div style={{ backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Issue Lifecycle Breakdown ({filteredIssues.length})
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(['ALL', 'RESOLVED', 'STILL_OPEN', 'NEW'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterState(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: filterState === tab ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: filterState === tab ? '#1b1b1b' : 'transparent',
                    color: filterState === tab ? '#ffffff' : '#a1a1aa'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredIssues.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                No issues match the selected filter state.
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isResolved = issue.lifecycle_state === 'RESOLVED';
                const isStillOpen = issue.lifecycle_state === 'STILL_OPEN';
                const badgeColor = isResolved ? '#10b981' : isStillOpen ? '#ef4444' : '#eab308';
                const cropUrl = issue.evidence_reference ? getImageUrl(issue.evidence_reference.url) : null;

                return (
                  <div
                    key={issue.issue_id}
                    style={{
                      padding: '16px',
                      borderRadius: '6px',
                      backgroundColor: '#1b1b1b',
                      border: `1px solid ${badgeColor}40`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        backgroundColor: `${badgeColor}20`,
                        color: badgeColor,
                        flexShrink: 0
                      }}>
                        {issue.lifecycle_state}
                      </span>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                          [{issue.category}] {issue.reason}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '6px', display: 'flex', gap: '20px' }}>
                          <span>EXPECTED: <strong style={{ color: '#10b981' }}>{issue.expected_value || 'N/A'}</strong></span>
                          <span>FOUND: <strong style={{ color: badgeColor }}>{issue.found_value || 'N/A'}</strong></span>
                          <span>FINGERPRINT: <code style={{ color: '#71717a' }}>{issue.fingerprint}</code></span>
                        </div>
                      </div>
                    </div>

                    {cropUrl && (
                      <div style={{ width: '120px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
                        <img src={cropUrl} alt="Evidence Crop" style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#0a0a0a' }} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // RENDER MODE 1: POST-FIX RE-CHECK SETUP & UPLOAD VIEW
  // -------------------------------------------------------------------
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <RotateCcw size={18} color="#06b6d4" />
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#06b6d4', fontWeight: 600 }}>RE-CHECK LIFECYCLE WORKFLOW</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
          Post-Fix Control Cabinet Re-Check Inspection
        </h1>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px', margin: 0 }}>
          Select a previous failed or under-review inspection, upload a corrected cabinet photograph, and execute differential re-check lifecycle analysis against engineering expectations.
        </p>
      </div>

      {/* Error Banners */}
      {validationError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {apiError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}>
          <AlertCircle size={18} />
          <span>API Error: {apiError}</span>
        </div>
      )}

      {/* Step 1: Select Parent Inspection */}
      <div style={{
        padding: '24px',
        backgroundColor: '#161616',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={18} color="#3b82f6" /> 1. Select Parent Inspection Record
          </h3>
          <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
            HISTORICAL RECORDS: {storedInspections.length}
          </span>
        </div>

        {loadingInspections ? (
          <div style={{ padding: '16px', color: '#71717a', fontSize: '13px' }}>Loading inspection registry...</div>
        ) : storedInspections.length === 0 ? (
          <div style={{ padding: '16px', color: '#eab308', fontSize: '13px', backgroundColor: '#1b1b1b', borderRadius: '6px' }}>
            No prior inspection records found in database. Please run a New Inspection first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select
              value={selectedInspectionId}
              onChange={(e) => handleSelectInspectionChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#1b1b1b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Parent Inspection for Re-Check --</option>
              {storedInspections.map((ins) => (
                <option key={ins.inspection_id} value={ins.inspection_id}>
                  {ins.inspection_id} — Cabinet {ins.cabinet_id} [{ins.overall_status}] ({ins.issues?.length || 0} Open Issues) — {new Date(ins.timestamp).toLocaleString()}
                </option>
              ))}
            </select>

            {/* Selected Inspection Context Card */}
            {selectedInspection && (
              <div style={{
                padding: '16px',
                backgroundColor: '#1b1b1b',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                    Selected Inspection: <code style={{ color: '#3b82f6' }}>{selectedInspection.inspection_id}</code>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    backgroundColor: selectedInspection.overall_status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: selectedInspection.overall_status === 'PASS' ? '#10b981' : '#ef4444'
                  }}>
                    PREVIOUS {selectedInspection.overall_status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  Cabinet ID: <strong style={{ color: '#ffffff' }}>{selectedInspection.cabinet_id}</strong> | Previous Open Defects: <strong style={{ color: '#ef4444' }}>{selectedInspection.issues?.length || 0} Items</strong>
                </div>

                {/* Display previous issues list */}
                {selectedInspection.issues && selectedInspection.issues.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>RECORDED DEFECTS TO RESOLVE:</div>
                    {selectedInspection.issues.map((iss, idx) => (
                      <div key={idx} style={{ fontSize: '11px', color: '#ef4444', backgroundColor: '#121212', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>• [{iss.category}] {iss.reason}</span>
                        <span style={{ color: '#71717a' }}>Expected: {iss.expected_value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Corrected Photograph Upload Card */}
      <div style={{
        padding: '24px',
        backgroundColor: '#161616',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={18} color="#06b6d4" /> 2. Upload Corrected Cabinet Photograph
        </h3>

        {!correctedPhoto ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            style={{
              padding: '36px 20px',
              backgroundColor: isDragOver ? '#222222' : '#1b1b1b',
              borderRadius: '8px',
              border: `2px dashed ${isDragOver ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              textAlign: 'center',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <Upload size={36} color={isDragOver ? '#06b6d4' : '#71717a'} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Drag & Drop Corrected Cabinet Photo Here
              </div>
              <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                Supports JPG, JPEG, or PNG (Max 10 MB)
              </div>
            </div>

            <label style={{
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#3b82f6',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Browse Image File
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ) : (
          /* Display Loaded Photo Details & Preview */
          <div style={{
            padding: '16px',
            backgroundColor: '#1b1b1b',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {photoPreviewUrl && (
                <img
                  src={photoPreviewUrl}
                  alt="Corrected Preview"
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              )}

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Corrected Photo Loaded
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                  {correctedPhoto.name}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                  Size: {fileSizeFormatted} {fileDimensions ? `| Resolution: ${fileDimensions.width} × ${fileDimensions.height}` : ''}
                </div>
              </div>
            </div>

            <button
              onClick={handleRemovePhoto}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: '#121212',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <X size={14} /> Remove / Replace
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Execute Re-check Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleExecuteRecheck}
          disabled={!selectedInspectionId || !correctedPhoto || isSubmitting || !!validationError}
          style={{
            padding: '14px 28px',
            borderRadius: '6px',
            backgroundColor: (!selectedInspectionId || !correctedPhoto || isSubmitting || !!validationError) ? '#1b1b1b' : '#06b6d4',
            color: (!selectedInspectionId || !correctedPhoto || isSubmitting || !!validationError) ? '#71717a' : '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: (!selectedInspectionId || !correctedPhoto || isSubmitting || !!validationError) ? 'not-allowed' : 'pointer',
            boxShadow: (!selectedInspectionId || !correctedPhoto || isSubmitting || !!validationError) ? 'none' : '0 4px 20px -2px rgba(6, 182, 212, 0.5)',
            transition: 'all 0.15s ease'
          }}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
          <span>{isSubmitting ? submissionMsg : 'Execute Post-Fix Re-Check Pipeline'}</span>
        </button>
      </div>
    </div>
  );
}
