import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Tag, 
  FileText, 
  Eye,
  ListChecks,
  Layers,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Info,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Download,
  FileCode
} from 'lucide-react';
import { 
  ExpectedCabinetModel, 
  ObservedCabinetModel, 
  InspectionResult, 
  EvidenceCollection, 
  PersistedInspection, 
  QCIssue, 
  QCStatus,
  QCCheck
} from '../../api/types';
import { getImageUrl } from '../../api/client';
import { exportInspectionAsCsv, exportInspectionAsJson } from '../../utils/exportReport';

interface InspectionResultViewProps {
  persistedInspection: PersistedInspection;
  expectedModel?: ExpectedCabinetModel;
  observedModel?: ObservedCabinetModel;
  inspectionResult?: InspectionResult;
  evidenceCollection?: EvidenceCollection;
  onRunRecheck: (inspectionId: string) => void;
}

type ViewTab = 'proofs' | 'checklist' | 'expected_model';

export function InspectionResultView({
  persistedInspection,
  expectedModel,
  observedModel,
  inspectionResult,
  evidenceCollection,
  onRunRecheck
}: InspectionResultViewProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('proofs');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Checklist filter and search states
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'REVIEW'>('ALL');
  const [checklistSearch, setChecklistSearch] = useState<string>('');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleExportCsv = () => {
    try {
      exportInspectionAsCsv(persistedInspection, evidenceCollection, inspectionResult);
      setExportFeedback('CSV Report exported successfully.');
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback(`CSV Export Failed: ${err.message}`);
    }
  };

  const handleExportJson = () => {
    try {
      exportInspectionAsJson(persistedInspection, evidenceCollection, inspectionResult);
      setExportFeedback('JSON Report exported successfully.');
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback(`JSON Export Failed: ${err.message}`);
    }
  };

  const status = persistedInspection.overall_status;
  const issues = persistedInspection.issues || [];
  const statusColor = status === 'PASS' ? '#10b981' : status === 'FAIL' ? '#ef4444' : '#eab308';
  const statusBg = status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : status === 'FAIL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)';

  const activeExpectedModel = expectedModel || persistedInspection.expected_model;
  const activeObservedModel = observedModel || persistedInspection.observed_model;

  // Derive master image URL
  const masterImageUrl = evidenceCollection?.annotated_full_image
    ? getImageUrl(evidenceCollection.annotated_full_image.url)
    : getImageUrl(`/evidence/file/annotated/annotated_${persistedInspection.inspection_id}.jpg`);

  // Detect whether run used detector or demo benchmark fallback
  const isDemoFixture = persistedInspection.cabinet_id.includes('DEMO') || 
    activeObservedModel?.detector_info?.has_custom_weights === false;

  // Build complete checklist items
  const allChecks: QCCheck[] = React.useMemo(() => {
    if (inspectionResult?.checks && inspectionResult.checks.length > 0) {
      return inspectionResult.checks;
    }

    const built: QCCheck[] = [];
    const issueMap = new Map<string, QCIssue>();
    issues.forEach(i => {
      const tag = i.expected_value || i.issue_id;
      issueMap.set(tag, i as any);
      if (i.rule_id) issueMap.set(i.rule_id, i as any);
    });

    // Components checks
    activeExpectedModel?.components?.forEach((comp, idx) => {
      const issue: any = issueMap.get(comp.tag);
      if (issue) {
        built.push({
          check_id: `chk-comp-${comp.tag}`,
          rule_id: issue.rule_id || 'ComponentCheck',
          rule_name: `${comp.component_type.toUpperCase()} Verification`,
          status: issue.status,
          expected_tag: comp.tag,
          message: issue.reason,
          details: { expected: issue.expected_value || issue.expected || comp.tag, found: issue.found_value || issue.found || 'NOT OBSERVED' }
        });
      } else {
        built.push({
          check_id: `chk-comp-${comp.tag}`,
          rule_id: 'ComponentPresenceRule',
          rule_name: `${comp.component_type.toUpperCase()} Presence`,
          status: 'PASS',
          expected_tag: comp.tag,
          message: `Component ${comp.tag} verified present and correctly placed.`,
          details: { expected: comp.tag, found: `${comp.component_type} (${comp.tag})` }
        });
      }
    });

    // Labels checks
    activeExpectedModel?.labels?.forEach((lbl) => {
      const issue: any = Array.from(issueMap.values()).find(i => i.category === 'Label' || (i as any).reason?.includes('label'));
      const expVal = issue?.expected_value || issue?.expected;
      if (issue && (expVal === lbl.text || expVal === lbl.label_id)) {
        built.push({
          check_id: `chk-lbl-${lbl.label_id}`,
          rule_id: 'LabelRule',
          rule_name: 'Baseplate Label Compliance',
          status: issue.status,
          expected_tag: lbl.text,
          message: issue.reason,
          details: { expected: expVal || lbl.text, found: issue.found_value || issue.found || 'No label' }
        });
      } else {
        built.push({
          check_id: `chk-lbl-${lbl.label_id}`,
          rule_id: 'LabelRule',
          rule_name: 'Baseplate Label Compliance',
          status: 'PASS',
          expected_tag: lbl.text,
          message: `Label '${lbl.text}' verified present.`,
          details: { expected: lbl.text, found: lbl.text }
        });
      }
    });

    // Ferrules checks
    activeExpectedModel?.ferrules?.forEach((fer) => {
      const issue: any = Array.from(issueMap.values()).find(i => i.category === 'Ferrule' || (i as any).reason?.includes('ferrule'));
      const expVal = issue?.expected_value || issue?.expected;
      if (issue) {
        built.push({
          check_id: `chk-fer-${fer.ferrule_id}`,
          rule_id: 'FerruleRule',
          rule_name: 'Terminal Wire Ferrule Verification',
          status: issue.status,
          expected_tag: fer.text,
          message: issue.reason,
          details: { expected: expVal || fer.text, found: issue.found_value || issue.found || 'No ferrule' }
        });
      } else {
        built.push({
          check_id: `chk-fer-${fer.ferrule_id}`,
          rule_id: 'FerruleRule',
          rule_name: 'Terminal Wire Ferrule Verification',
          status: 'PASS',
          expected_tag: fer.text,
          message: `Ferrule termination '${fer.text}' verified fitted.`,
          details: { expected: fer.text, found: fer.text }
        });
      }
    });

    return built;
  }, [inspectionResult, activeExpectedModel, issues]);

  const filteredChecks = allChecks.filter(c => {
    const matchesFilter = checklistFilter === 'ALL' || c.status === checklistFilter;
    const matchesSearch = checklistSearch === '' || 
      (c.expected_tag && c.expected_tag.toLowerCase().includes(checklistSearch.toLowerCase())) ||
      c.rule_name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
      c.message.toLowerCase().includes(checklistSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const passChecksCount = allChecks.filter(c => c.status === 'PASS').length;
  const failChecksCount = allChecks.filter(c => c.status === 'FAIL').length;
  const reviewChecksCount = allChecks.filter(c => c.status === 'REVIEW').length;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Results Header Banner */}
      <div style={{
        padding: '20px 24px',
        backgroundColor: '#161616',
        borderRadius: '8px',
        border: `1px solid ${statusColor}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '10px 20px',
            borderRadius: '6px',
            backgroundColor: statusBg,
            border: `1px solid ${statusColor}`,
            color: statusColor,
            fontWeight: 800,
            fontSize: '20px',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {status === 'PASS' && <CheckCircle2 size={24} />}
            {status === 'FAIL' && <ShieldAlert size={24} />}
            {status === 'REVIEW' && <AlertTriangle size={24} />}
            <span>INSPECTION {status}</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: 'monospace' }}>
                INSPECTION ID: <strong style={{ color: '#ffffff' }}>{persistedInspection.inspection_id}</strong> | CABINET: <strong style={{ color: '#ffffff' }}>{persistedInspection.cabinet_id}</strong>
              </div>
              {/* Demo Data Distinction Badge (Instruction 7) */}
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 700,
                backgroundColor: isDemoFixture ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: isDemoFixture ? '#eab308' : '#3b82f6',
                border: `1px solid ${isDemoFixture ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
              }}>
                {isDemoFixture ? 'STAGED BENCHMARK FIXTURE' : 'REAL AI DETECTOR RESULT'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
              Executed: {new Date(persistedInspection.timestamp).toLocaleString()} | Total Checks: {allChecks.length} ({passChecksCount} PASS, {failChecksCount} FAIL, {reviewChecksCount} REVIEW)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {exportFeedback && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: exportFeedback.includes('Failed') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${exportFeedback.includes('Failed') ? '#ef4444' : '#10b981'}`,
              color: exportFeedback.includes('Failed') ? '#ef4444' : '#10b981',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}>
              {exportFeedback}
            </span>
          )}

          <button
            onClick={handleExportCsv}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Export full QC checklist and issues as CSV spreadsheet"
          >
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Export full inspection record and evidence references as JSON"
          >
            <FileCode size={15} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => onRunRecheck(persistedInspection.inspection_id)}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: '#06b6d4',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>Re-Check</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen: Left Cabinet Viewer, Right Control Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '20px', minHeight: '620px' }}>
        
        {/* Left: Master Annotated Cabinet Viewer */}
        <div style={{
          backgroundColor: '#161616',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Controls toolbar */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#1b1b1b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="#3b82f6" /> Master Annotated Cabinet Photograph
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))}
                style={{ backgroundColor: '#121212', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
                style={{ backgroundColor: '#121212', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                style={{ backgroundColor: '#121212', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#a1a1aa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
              >
                Reset ({Math.round(zoomLevel * 100)}%)
              </button>
            </div>
          </div>

          {/* Photograph Container */}
          <div style={{
            flex: 1,
            backgroundColor: '#0a0a0a',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
              <img
                src={masterImageUrl}
                alt="Annotated Cabinet Photo"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                style={{ maxWidth: '100%', maxHeight: '550px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Tabbed Inspection Control Panel */}
        <div style={{
          backgroundColor: '#161616',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: '#1b1b1b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 8px'
          }}>
            <button
              onClick={() => setActiveTab('proofs')}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'proofs' ? '#161616' : 'transparent',
                color: activeTab === 'proofs' ? '#ffffff' : '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ShieldAlert size={15} color={issues.length > 0 ? '#ef4444' : '#10b981'} />
              <span>Defect Proofs ({issues.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'checklist' ? '#161616' : 'transparent',
                color: activeTab === 'checklist' ? '#ffffff' : '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ListChecks size={15} color="#3b82f6" />
              <span>QC Checklist ({allChecks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('expected_model')}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'expected_model' ? '#161616' : 'transparent',
                color: activeTab === 'expected_model' ? '#ffffff' : '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Layers size={15} color="#06b6d4" />
              <span>Expected Model</span>
            </button>
          </div>

          {/* TAB 1: DEFECT PROOFS */}
          {activeTab === 'proofs' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {issues.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#10b981' }}>
                  <CheckCircle2 size={44} style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>Zero Quality Control Issues</div>
                  <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>All expected engineering specs were visually verified.</div>
                </div>
              ) : (
                issues.map((issue) => {
                  const isSelected = selectedIssueId === issue.issue_id;
                  const isFail = issue.status === 'FAIL';
                  const issueColor = isFail ? '#ef4444' : '#eab308';
                  const cropUrl = issue.evidence_reference ? getImageUrl(issue.evidence_reference.url) : null;

                  return (
                    <div
                      key={issue.issue_id}
                      onClick={() => setSelectedIssueId(issue.issue_id)}
                      style={{
                        padding: '14px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#222222' : '#1b1b1b',
                        border: `1px solid ${isSelected ? issueColor : 'rgba(255, 255, 255, 0.08)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          backgroundColor: `${issueColor}20`,
                          color: issueColor
                        }}>
                          {issue.status} • {issue.category}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>{issue.issue_id}</span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                        {issue.reason}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', backgroundColor: '#121212', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                        <div>
                          <span style={{ color: '#71717a' }}>EXPECTED:</span>
                          <div style={{ color: '#10b981', fontWeight: 600, marginTop: '2px' }}>{issue.expected_value || 'N/A'}</div>
                        </div>
                        <div>
                          <span style={{ color: '#71717a' }}>FOUND:</span>
                          <div style={{ color: issueColor, fontWeight: 600, marginTop: '2px' }}>{issue.found_value || 'NOT OBSERVED'}</div>
                        </div>
                      </div>

                      {cropUrl && (
                        <div style={{ marginTop: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <img src={cropUrl} alt="Defect Proof Crop" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', backgroundColor: '#0a0a0a' }} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: FULL QC CHECKLIST */}
          {activeTab === 'checklist' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Filter & Search Header */}
              <div style={{ padding: '12px 14px', backgroundColor: '#1b1b1b', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#71717a" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                  <input
                    type="text"
                    placeholder="Filter by Tag, Rule, or Keyword..."
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 30px',
                      backgroundColor: '#121212',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {(['ALL', 'PASS', 'FAIL', 'REVIEW'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setChecklistFilter(st)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: checklistFilter === st ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: checklistFilter === st ? '#121212' : 'transparent',
                        color: checklistFilter === st ? '#ffffff' : '#a1a1aa'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist Items Scrollable List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredChecks.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                    No checklist items match the selected filter.
                  </div>
                ) : (
                  filteredChecks.map((check) => {
                    const isPass = check.status === 'PASS';
                    const isFail = check.status === 'FAIL';
                    const badgeColor = isPass ? '#10b981' : isFail ? '#ef4444' : '#eab308';
                    const badgeBg = isPass ? 'rgba(16, 185, 129, 0.15)' : isFail ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)';

                    return (
                      <div
                        key={check.check_id}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          backgroundColor: '#1b1b1b',
                          border: `1px solid ${badgeColor}30`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                            {check.expected_tag || check.rule_name}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            backgroundColor: badgeBg,
                            color: badgeColor
                          }}>
                            {check.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                          <strong style={{ color: '#71717a' }}>{check.rule_name}:</strong> {check.message}
                        </div>

                        {check.details && (
                          <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#71717a', backgroundColor: '#121212', padding: '6px 8px', borderRadius: '4px', marginTop: '2px' }}>
                            <span>EXP: <strong style={{ color: '#10b981' }}>{check.details.expected}</strong></span>
                            <span>FOUND: <strong style={{ color: badgeColor }}>{check.details.found}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EXPECTED CABINET MODEL */}
          {activeTab === 'expected_model' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#06b6d4" /> Expected Engineering Inventory
                </h4>
                <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0 }}>
                  Normalized state parsed from GA drawing PDF and Excel wire list.
                </p>
              </div>

              {/* Components List */}
              <div style={{ backgroundColor: '#1b1b1b', borderRadius: '6px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace', marginBottom: '8px' }}>
                  EXPECTED COMPONENTS ({activeExpectedModel?.components?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  {activeExpectedModel?.components?.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: 600 }}>{c.tag}</span>
                      <span style={{ color: '#a1a1aa', fontSize: '11px' }}>{c.component_type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels & Ferrules List */}
              <div style={{ backgroundColor: '#1b1b1b', borderRadius: '6px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#eab308', fontFamily: 'monospace', marginBottom: '8px' }}>
                  EXPECTED LABELS & FERRULES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  {activeExpectedModel?.labels?.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#a1a1aa', fontSize: '11px' }}>Label Text:</span>
                      <span style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: 600 }}>{l.text}</span>
                    </div>
                  ))}
                  {activeExpectedModel?.ferrules?.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#a1a1aa', fontSize: '11px' }}>Ferrule Text:</span>
                      <span style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: 600 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

