import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Zap,
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Layers,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Info
} from 'lucide-react';
import { 
  parseEngineeringDocuments, 
  inspectCabinetImage, 
  evaluateCabinetQC, 
  generateVisualEvidence, 
  persistInspection 
} from '../../api/client';
import { 
  ExpectedCabinetModel, 
  ObservedCabinetModel, 
  InspectionResult, 
  EvidenceCollection, 
  PersistedInspection 
} from '../../api/types';

interface NewInspectionViewProps {
  onCompleteInspection: (
    persisted: PersistedInspection,
    expected: ExpectedCabinetModel,
    observed: ObservedCabinetModel,
    qcResult: InspectionResult,
    evidence: EvidenceCollection
  ) => void;
  presetScenario?: 'fault1' | 'fault2' | 'fault3' | 'fault4' | 'pass';
}

type PreviewTab = 'components' | 'wires' | 'labels' | 'validation';

export function NewInspectionView({ onCompleteInspection, presetScenario }: NewInspectionViewProps) {
  // Navigation & Sub-Phase Stepper
  // Step 1: Upload & Validate Files
  // Step 2: Parsed Engineering Preview & Approval
  // Step 3: Executing Vision & QC Pipeline
  const [subPhase, setSubPhase] = useState<'upload' | 'preview' | 'executing'>('upload');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Files & inputs
  const [cabinetPhoto, setCabinetPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [gaPdf, setGaPdf] = useState<File | null>(null);
  const [wireExcel, setWireExcel] = useState<File | null>(null);
  const [cabinetId, setCabinetId] = useState<string>('CAB-2026-001');

  // Pipeline Data Stored Across Steps
  const [expectedModel, setExpectedModel] = useState<ExpectedCabinetModel | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('components');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // File Handlers with Client Validation
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setApiError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        setValidationError("Invalid photo format. Please upload a JPG or PNG cabinet image.");
        return;
      }
      setCabinetPhoto(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setApiError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setValidationError("Invalid GA drawing format. GA drawing must be a PDF (.pdf) file.");
        return;
      }
      setGaPdf(file);
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setApiError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        setValidationError("Invalid wire list format. Wire list must be an Excel spreadsheet (.xlsx or .xls).");
        return;
      }
      setWireExcel(file);
    }
  };

  // Step 1 -> Step 2: Parse Engineering References & Build Model Preview
  const handleParseEngineeringReferences = async () => {
    setValidationError(null);
    setApiError(null);

    if (!cabinetId.trim()) {
      setValidationError("Cabinet Project Tag ID is required.");
      return;
    }

    if (!gaPdf && !wireExcel) {
      setValidationError("At least one engineering document (GA Drawing PDF or Wire List Excel) is required to build the Expected Cabinet Model.");
      return;
    }

    setLoading(true);
    setLoadingMsg("Parsing GA Drawing PDF & Excel Wire List references with backend parsers...");

    try {
      const parsedExpected = await parseEngineeringDocuments(
        gaPdf || undefined,
        wireExcel || undefined,
        cabinetId
      );
      setExpectedModel(parsedExpected);
      setSubPhase('preview');
    } catch (err: any) {
      setApiError(err.message || "Engineering document parsing failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Execute Vision QC Pipeline & Persist
  const handleExecuteFullInspection = async () => {
    if (!expectedModel) return;
    if (!cabinetPhoto) {
      setValidationError("Please attach a Cabinet Photograph (JPG/PNG) to proceed with visual quality inspection.");
      return;
    }

    setLoading(true);
    setSubPhase('executing');
    setApiError(null);

    try {
      // Step A: Inspect Cabinet Image
      setLoadingMsg("Inspecting Cabinet Photograph with Computer Vision & OCR Engine...");
      const parsedObserved = await inspectCabinetImage(cabinetPhoto);

      // Step B: Run QC Rule Evaluation
      setLoadingMsg("Evaluating Quality Control Decision Rules...");
      const evalResult = await evaluateCabinetQC(expectedModel, parsedObserved);

      // Step C: Generate Visual Evidence
      setLoadingMsg("Generating Master Annotated Photo & Zoomed Defect Crops...");
      const eviCollection = await generateVisualEvidence(
        evalResult,
        parsedObserved,
        cabinetPhoto || undefined
      );

      // Step D: Persist to Immutable History
      setLoadingMsg("Persisting Inspection to Immutable SQLite Database...");
      const persisted = await persistInspection(evalResult, expectedModel, parsedObserved);

      // Complete & transition to results view
      onCompleteInspection(persisted, expectedModel, parsedObserved, evalResult, eviCollection);

    } catch (err: any) {
      setApiError(err.message || "Vision inspection execution failed.");
      setSubPhase('preview');
    } finally {
      setLoading(false);
    }
  };

  // Filtered expected model items for preview tables
  const filteredComponents = (expectedModel?.components || []).filter(c => 
    searchFilter === '' || 
    c.tag.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.component_type.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredWires = (expectedModel?.wires || []).filter(w =>
    searchFilter === '' ||
    w.wire_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    w.source_component.toLowerCase().includes(searchFilter.toLowerCase()) ||
    w.destination_component.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (w.ferrule && w.ferrule.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredLabels = (expectedModel?.labels || []).filter(l =>
    searchFilter === '' ||
    l.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (l.component_tag && l.component_tag.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const validationReport = expectedModel?.validation;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
          New Electrical Cabinet Quality Control Inspection
        </h1>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px', margin: 0 }}>
          Ingest engineering documents (GA Drawings & Excel Wire Lists), validate the expected cabinet model, and run computer vision QC.
        </p>
      </div>

      {/* Stepper Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#161616',
        padding: '16px 24px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {[
          { step: 1, label: '1. Ingest Documents', active: subPhase === 'upload' },
          { step: 2, label: '2. Validate Expected Model', active: subPhase === 'preview' },
          { step: 3, label: '3. Vision QC & Evidence', active: subPhase === 'executing' }
        ].map((s) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: s.active ? '#3b82f6' : (expectedModel && s.step === 1) ? '#10b981' : '#1b1b1b',
              border: s.active ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(expectedModel && s.step === 1) ? <Check size={14} /> : s.step}
            </div>
            <span style={{ fontSize: '12px', color: s.active ? '#ffffff' : '#71717a', fontWeight: s.active ? 600 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Client Validation Error Alert */}
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
          <AlertCircle size={20} />
          <span>{validationError}</span>
        </div>
      )}

      {/* API Error Alert */}
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
          <AlertCircle size={20} />
          <span>API Error: {apiError}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* SUB-PHASE 1: FILE INGESTION & DOCUMENT VALIDATION GATE */}
      {/* ------------------------------------------------------------------- */}
      {subPhase === 'upload' && (
        <div style={{
          padding: '24px',
          backgroundColor: '#161616',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#3b82f6" /> 1. Upload Cabinet Photograph & Engineering References
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Cabinet Project Tag ID *</label>
            <input
              type="text"
              value={cabinetId}
              onChange={(e) => setCabinetId(e.target.value)}
              placeholder="e.g. CAB-2026-001"
              style={{
                padding: '10px 14px',
                backgroundColor: '#1b1b1b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'monospace',
                width: '320px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Cabinet Photo Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#1b1b1b',
              borderRadius: '8px',
              border: `1px ${cabinetPhoto ? 'solid #10b981' : 'dashed rgba(255, 255, 255, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textAlign: 'center'
            }}>
              <ImageIcon size={32} color={cabinetPhoto ? '#10b981' : '#3b82f6'} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Cabinet Photograph</div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>JPG or PNG File</div>
              </div>
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} style={{ fontSize: '11px', color: '#a1a1aa', width: '100%' }} />
              {cabinetPhoto && (
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> {cabinetPhoto.name}
                </div>
              )}
            </div>

            {/* GA Drawing Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#1b1b1b',
              borderRadius: '8px',
              border: `1px ${gaPdf ? 'solid #06b6d4' : 'dashed rgba(255, 255, 255, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textAlign: 'center'
            }}>
              <FileText size={32} color={gaPdf ? '#06b6d4' : '#71717a'} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>GA Drawing PDF</div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>Layout PDF Document</div>
              </div>
              <input type="file" accept="application/pdf" onChange={handleGaChange} style={{ fontSize: '11px', color: '#a1a1aa', width: '100%' }} />
              {gaPdf && (
                <div style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> {gaPdf.name}
                </div>
              )}
            </div>

            {/* Wire List Excel Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#1b1b1b',
              borderRadius: '8px',
              border: `1px ${wireExcel ? 'solid #eab308' : 'dashed rgba(255, 255, 255, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textAlign: 'center'
            }}>
              <FileSpreadsheet size={32} color={wireExcel ? '#eab308' : '#71717a'} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Wire / Label List Excel</div>
                <div style={{ fontSize: '11px', color: '#71717a' }}>XLSX or XLS Spreadsheet</div>
              </div>
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelChange} style={{ fontSize: '11px', color: '#a1a1aa', width: '100%' }} />
              {wireExcel && (
                <div style={{ fontSize: '11px', color: '#eab308', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> {wireExcel.name}
                </div>
              )}
            </div>
          </div>

          {/* Validation Gate Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={handleParseEngineeringReferences}
              disabled={loading || (!gaPdf && !wireExcel)}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                backgroundColor: (loading || (!gaPdf && !wireExcel)) ? '#1b1b1b' : '#3b82f6',
                color: (loading || (!gaPdf && !wireExcel)) ? '#71717a' : '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: (loading || (!gaPdf && !wireExcel)) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              <span>{loading ? loadingMsg : 'Parse & Validate Engineering Documents'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* SUB-PHASE 2: PARSED ENGINEERING MODEL PREVIEW & VALIDATION GATE */}
      {/* ------------------------------------------------------------------- */}
      {subPhase === 'preview' && expectedModel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Action Bar */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#161616',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 600 }}>
                PARSED ENGINEERING MODEL VALIDATION PREVIEW
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '2px 0 0 0' }}>
                Cabinet: {expectedModel.cabinet_id}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSubPhase('upload')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#1b1b1b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#a1a1aa',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                ← Modify Uploaded Files
              </button>

              <button
                onClick={handleExecuteFullInspection}
                disabled={loading || !cabinetPhoto}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  backgroundColor: (!cabinetPhoto || loading) ? '#1b1b1b' : '#10b981',
                  color: (!cabinetPhoto || loading) ? '#71717a' : '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: (!cabinetPhoto || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                <span>Approve & Run Vision QC Inspection</span>
              </button>
            </div>
          </div>

          {/* Validation Cards Grid (GA PDF, Excel, Backend Validator Report) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            
            {/* GA PDF Summary Card */}
            <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace' }}>
                  GA DRAWING SUMMARY
                </span>
                <FileText size={16} color="#06b6d4" />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                {expectedModel.metadata?.ga_summary?.total_extracted_tags || expectedModel.components.length} Tags
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
                Pages Processed: {expectedModel.metadata?.ga_summary?.pages_processed || 1} | Scanned: {expectedModel.metadata?.ga_summary?.is_scanned_pdf ? 'Yes (OCR)' : 'No (Text)'}
              </div>
            </div>

            {/* Excel Summary Card */}
            <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#eab308', fontFamily: 'monospace' }}>
                  EXCEL WIRE LIST SUMMARY
                </span>
                <FileSpreadsheet size={16} color="#eab308" />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                {expectedModel.wires.length} Wires / {expectedModel.ferrules.length} Ferrules
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
                Sheet: {expectedModel.metadata?.excel_summary?.sheet_name || 'WireList'} | Labels: {expectedModel.labels.length}
              </div>
            </div>

            {/* Engineering Validation Status Card */}
            <div style={{
              padding: '16px',
              backgroundColor: '#161616',
              borderRadius: '8px',
              border: `1px solid ${validationReport?.status === 'VALID' ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: validationReport?.status === 'VALID' ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                  VALIDATION STATUS
                </span>
                <ShieldCheck size={16} color={validationReport?.status === 'VALID' ? '#10b981' : '#ef4444'} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: validationReport?.status === 'VALID' ? '#10b981' : '#ef4444' }}>
                {validationReport?.status || 'VALID'}
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
                {validationReport?.errors?.length || 0} Errors | {validationReport?.warnings?.length || 0} Warnings | {validationReport?.conflicts?.length || 0} Conflicts
              </div>
            </div>
          </div>

          {/* Validation Warnings / Conflicts Listing if present */}
          {validationReport && (validationReport.errors.length > 0 || validationReport.warnings.length > 0 || validationReport.conflicts.length > 0) && (
            <div style={{ padding: '16px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Parsing Validation Exceptions Flagged by Backend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {validationReport.errors.map((err, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#ef4444', backgroundColor: '#121212', padding: '8px', borderRadius: '4px' }}>
                    <strong>[ERROR {err.code}]</strong> {err.message}
                  </div>
                ))}
                {validationReport.warnings.map((warn, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#eab308', backgroundColor: '#121212', padding: '8px', borderRadius: '4px' }}>
                    <strong>[WARNING {warn.code}]</strong> {warn.message}
                  </div>
                ))}
                {validationReport.conflicts.map((conf, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#f97316', backgroundColor: '#121212', padding: '8px', borderRadius: '4px' }}>
                    <strong>[CONFLICT {conf.code}]</strong> {conf.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Inventory Tabs & Search Control */}
          <div style={{ backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#1b1b1b',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {[
                  { id: 'components', label: `Components (${expectedModel.components.length})` },
                  { id: 'wires', label: `Wires & Ferrules (${expectedModel.wires.length})` },
                  { id: 'labels', label: `Baseplate Labels (${expectedModel.labels.length})` }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPreviewTab(t.id as PreviewTab)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: previewTab === t.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: previewTab === t.id ? '#121212' : 'transparent',
                      color: previewTab === t.id ? '#ffffff' : '#a1a1aa'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} color="#71717a" style={{ position: 'absolute', left: '8px', top: '9px' }} />
                <input
                  type="text"
                  placeholder="Filter Inventory..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px 6px 28px',
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            {/* TAB 1: EXPECTED COMPONENTS TABLE */}
            {previewTab === 'components' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b1b1b', color: '#71717a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '10px 16px' }}>TAG</th>
                    <th style={{ padding: '10px 16px' }}>RAW TAG</th>
                    <th style={{ padding: '10px 16px' }}>TYPE</th>
                    <th style={{ padding: '10px 16px' }}>EXPECTED ORDER</th>
                    <th style={{ padding: '10px 16px' }}>PROVENANCE SOURCE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComponents.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#ffffff' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6' }}>{c.tag}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#a1a1aa' }}>{c.raw_tag}</td>
                      <td style={{ padding: '10px 16px' }}>{c.component_type}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{c.expected_order ?? 'N/A'}</td>
                      <td style={{ padding: '10px 16px', color: '#71717a', fontSize: '11px' }}>
                        {c.source.type} • {c.source.file} {c.source.page ? `(Page ${c.source.page})` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB 2: WIRES & FERRULES TABLE */}
            {previewTab === 'wires' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b1b1b', color: '#71717a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '10px 16px' }}>WIRE ID</th>
                    <th style={{ padding: '10px 16px' }}>ORIGIN → DESTINATION</th>
                    <th style={{ padding: '10px 16px' }}>COLOUR</th>
                    <th style={{ padding: '10px 16px' }}>FERRULE TAG</th>
                    <th style={{ padding: '10px 16px' }}>SOURCE SHEET / ROW</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWires.map((w, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#ffffff' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#eab308' }}>{w.wire_id}</td>
                      <td style={{ padding: '10px 16px' }}>{w.source_component} → {w.destination_component}</td>
                      <td style={{ padding: '10px 16px' }}>{w.colour || 'N/A'}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#10b981' }}>{w.ferrule || 'N/A'}</td>
                      <td style={{ padding: '10px 16px', color: '#71717a', fontSize: '11px' }}>
                        {w.source.file} (Sheet: {w.source.sheet || 'WireList'}, Row {w.source.row || 'N/A'})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB 3: BASEPLATE LABELS TABLE */}
            {previewTab === 'labels' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b1b1b', color: '#71717a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '10px 16px' }}>LABEL ID</th>
                    <th style={{ padding: '10px 16px' }}>LABEL TEXT</th>
                    <th style={{ padding: '10px 16px' }}>ASSOCIATED COMPONENT</th>
                    <th style={{ padding: '10px 16px' }}>PROVENANCE SOURCE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLabels.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#ffffff' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#a1a1aa' }}>{l.label_id}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#06b6d4' }}>{l.text}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{l.component_tag || 'N/A'}</td>
                      <td style={{ padding: '10px 16px', color: '#71717a', fontSize: '11px' }}>{l.source.file}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* SUB-PHASE 3: EXECUTING VISION & QC PIPELINE LOADING OVERLAY */}
      {/* ------------------------------------------------------------------- */}
      {subPhase === 'executing' && (
        <div style={{
          padding: '60px 24px',
          backgroundColor: '#161616',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center'
        }}>
          <Loader2 size={44} color="#3b82f6" className="animate-spin" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Executing Computer Vision Quality Inspection
            </h3>
            <p style={{ fontSize: '13px', color: '#3b82f6', marginTop: '6px', margin: 0, fontFamily: 'monospace' }}>
              {loadingMsg}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
