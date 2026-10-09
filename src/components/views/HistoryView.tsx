import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  FileText,
  FileSpreadsheet,
  FileCode,
  Download
} from 'lucide-react';
import { listInspections, getInspection } from '../../api/client';
import { PersistedInspection, QCStatus } from '../../api/types';
import { exportInspectionAsCsv, exportInspectionAsJson } from '../../utils/exportReport';

interface HistoryViewProps {
  onSelectInspection: (inspectionId: string) => void;
  onLaunchRecheck: (inspectionId: string) => void;
}

export function HistoryView({ onSelectInspection, onLaunchRecheck }: HistoryViewProps) {
  const [inspections, setInspections] = useState<PersistedInspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadInspections = async () => {
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
    loadInspections();
  }, []);

  const filtered = inspections.filter(item => {
    const matchesStatus = filterStatus === 'ALL' || item.overall_status === filterStatus;
    const matchesSearch = item.inspection_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.cabinet_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner */}
      <div style={{
        padding: '20px 24px',
        backgroundColor: '#161616',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Audit & Inspection History Registry
          </h1>
          <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px', margin: 0 }}>
            Immutable historical inspection records persisted in SQLite database (`eagle_eye.db`).
          </p>
        </div>

        <button
          onClick={loadInspections}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: '#1b1b1b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#a1a1aa',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Refresh Registry
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#161616',
        padding: '14px 20px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="#71717a" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search ID or Cabinet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                backgroundColor: '#1b1b1b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {['ALL', 'PASS', 'FAIL', 'REVIEW'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: filterStatus === st ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: filterStatus === st ? '#1b1b1b' : 'transparent',
                  color: filterStatus === st ? '#ffffff' : '#a1a1aa'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#71717a', fontFamily: 'monospace' }}>
          Showing {filtered.length} of {inspections.length} Records
        </span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#161616', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>Loading historical records...</div>
        ) : error ? (
          <div style={{ padding: '24px', color: '#ef4444', fontSize: '13px' }}>Error loading history: {error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>No matching inspection records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1b1b1b', color: '#71717a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'monospace', fontSize: '11px' }}>
                <th style={{ padding: '12px 20px' }}>INSPECTION ID</th>
                <th style={{ padding: '12px 20px' }}>CABINET ID</th>
                <th style={{ padding: '12px 20px' }}>STATUS</th>
                <th style={{ padding: '12px 20px' }}>ISSUES COUNT</th>
                <th style={{ padding: '12px 20px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
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
                  <td style={{ padding: '14px 20px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onSelectInspection(item.inspection_id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#1b1b1b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#3b82f6',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={13} /> View
                    </button>

                    <button
                      onClick={() => exportInspectionAsCsv(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#1b1b1b',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Export CSV Report"
                    >
                      <FileSpreadsheet size={13} /> CSV
                    </button>

                    <button
                      onClick={() => exportInspectionAsJson(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#1b1b1b',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Export JSON Report"
                    >
                      <FileCode size={13} /> JSON
                    </button>

                    {item.overall_status !== 'PASS' && (
                      <button
                        onClick={() => onLaunchRecheck(item.inspection_id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#1b1b1b',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          color: '#06b6d4',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RotateCcw size={13} /> Re-check
                      </button>
                    )}
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
