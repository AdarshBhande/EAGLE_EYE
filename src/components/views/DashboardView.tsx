import React, { useEffect, useState } from 'react';
import { 
  FileCheck2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Zap, 
  Sparkles,
  Layers,
  Search,
  RefreshCw
} from 'lucide-react';
import { listInspections } from '../../api/client';
import { PersistedInspection, QCStatus } from '../../api/types';

interface DashboardViewProps {
  onStartInspection: () => void;
  onSelectInspection: (inspectionId: string) => void;
  onQuickLaunchScenario: (scenario: 'fault1' | 'fault2' | 'fault3' | 'fault4' | 'pass') => void;
}

export function DashboardView({ onStartInspection, onSelectInspection, onQuickLaunchScenario }: DashboardViewProps) {
  const [inspections, setInspections] = useState<PersistedInspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInspections();
      setInspections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inspection history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalInspections = inspections.length;
  const passCount = inspections.filter(i => i.overall_status === 'PASS').length;
  const failCount = inspections.filter(i => i.overall_status === 'FAIL').length;
  const reviewCount = inspections.filter(i => i.overall_status === 'REVIEW').length;
  const passRate = totalInspections > 0 ? Math.round((passCount / totalInspections) * 100) : 100;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Welcome Banner */}
      <div style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: '#1b1b1b',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(135deg, #1b1b1b 0%, #161616 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
              QC CONTROL ROOM
            </span>
            <span style={{ color: '#71717a', fontSize: '12px' }}>•</span>
            <span style={{ color: '#a1a1aa', fontSize: '12px' }}>AI-Assisted Cabinet Quality Control</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Electrical Cabinet Inspection Overview
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px', margin: 0, maxWidth: '640px' }}>
            Verify observed cabinet photographs against engineering truth (GA PDFs & Excel Wire Lists). Detect planted defects, review visual evidence, and track re-check lifecycles.
          </p>
        </div>

        <button
          onClick={onStartInspection}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px -2px rgba(59, 130, 246, 0.5)',
            transition: 'all 0.2s ease'
          }}
        >
          <FileCheck2 size={18} />
          <span>Start New Inspection</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ padding: '20px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '12px' }}>
            <span>TOTAL INSPECTIONS</span>
            <Layers size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}>
            {totalInspections}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Persisted in Database</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '12px' }}>
            <span>FIRST-PASS YIELD</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>
            {passRate}%
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>{passCount} PASS / {totalInspections} Total</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '12px' }}>
            <span>FAILED INSPECTIONS</span>
            <ShieldAlert size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>
            {failCount}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Requires Operator Re-check</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '12px' }}>
            <span>REVIEW ITEMS</span>
            <AlertTriangle size={16} color="#eab308" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#eab308', marginTop: '8px' }}>
            {reviewCount}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Ambiguous Visual Evidence</div>
        </div>
      </div>

      {/* Quick Launch Test Scenarios */}
      <div style={{
        padding: '20px',
        backgroundColor: '#161616',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={18} color="#eab308" />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Quick Launch Planted Fault Test Suite
          </h3>
          <span style={{ fontSize: '12px', color: '#71717a' }}>— Run full 6-phase pipeline instantly on staged sample data</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <button
            onClick={() => onQuickLaunchScenario('fault1')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 600 }}>FAULT 1</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>PS12 Missing</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Power Supply absent</div>
          </button>

          <button
            onClick={() => onQuickLaunchScenario('fault2')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 600 }}>FAULT 2</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>CB43 / CB44 Swap</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Positional inversion</div>
          </button>

          <button
            onClick={() => onQuickLaunchScenario('fault3')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 600 }}>FAULT 3</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>1CBP03 Label</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Label text missing</div>
          </button>

          <button
            onClick={() => onQuickLaunchScenario('fault4')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 600 }}>FAULT 4</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>X3 Ferrule</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Wire termination absent</div>
          </button>

          <button
            onClick={() => onQuickLaunchScenario('pass')}
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>BENCHMARK</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Correct Cabinet</div>
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>Full PASS evaluation</div>
          </button>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div style={{
        backgroundColor: '#161616',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Recent Cabinet Inspection History
          </h3>
          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>Loading inspections...</div>
        ) : error ? (
          <div style={{ padding: '24px', color: '#ef4444', fontSize: '13px' }}>Error: {error}</div>
        ) : inspections.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
            No inspections stored yet. Click "Start New Inspection" to begin.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1b1b1b', color: '#71717a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '11px' }}>
                <th style={{ padding: '12px 20px' }}>INSPECTION ID</th>
                <th style={{ padding: '12px 20px' }}>CABINET ID</th>
                <th style={{ padding: '12px 20px' }}>STATUS</th>
                <th style={{ padding: '12px 20px' }}>ISSUES</th>
                <th style={{ padding: '12px 20px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 10).map((item) => (
                <tr key={item.inspection_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#ffffff' }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 600 }}>{item.inspection_id}</td>
                  <td style={{ padding: '14px 20px' }}>{item.cabinet_id}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      backgroundColor: item.overall_status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : item.overall_status === 'FAIL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: item.overall_status === 'PASS' ? '#10b981' : item.overall_status === 'FAIL' ? '#ef4444' : '#eab308'
                    }}>
                      {item.overall_status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>{item.issues?.length || 0} Issues</td>
                  <td style={{ padding: '14px 20px', color: '#a1a1aa', fontSize: '12px' }}>{new Date(item.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectInspection(item.inspection_id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        backgroundColor: '#1b1b1b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#3b82f6',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
