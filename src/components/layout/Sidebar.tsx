import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  FileCheck2, 
  History, 
  ShieldAlert, 
  Cpu, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { fetchHealth } from '../../api/client';
import { HealthResponse } from '../../api/types';

interface SidebarProps {
  activeTab: 'dashboard' | 'new_inspection' | 'results' | 'recheck' | 'history';
  onSelectTab: (tab: 'dashboard' | 'new_inspection' | 'results' | 'recheck' | 'history') => void;
  selectedCabinetId?: string;
}

export function Sidebar({ activeTab, onSelectTab, selectedCabinetId }: SidebarProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const data = await fetchHealth();
        if (isMounted) {
          setHealth(data);
          setIsConnected(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsConnected(false);
          setHealth(null);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#161616',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#1b1b1b',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px -3px rgba(59, 130, 246, 0.3)'
          }}>
            <Eye size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff', margin: 0 }}>
              EAGLE EYE
            </h1>
            <p style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', margin: 0 }}>
              AI CABINET QC v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => onSelectTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '6px',
            border: activeTab === 'dashboard' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            backgroundColor: activeTab === 'dashboard' ? '#1b1b1b' : 'transparent',
            color: activeTab === 'dashboard' ? '#ffffff' : '#a1a1aa',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <LayoutDashboard size={18} color={activeTab === 'dashboard' ? '#3b82f6' : '#71717a'} />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => onSelectTab('new_inspection')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '6px',
            border: activeTab === 'new_inspection' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            backgroundColor: activeTab === 'new_inspection' ? '#1b1b1b' : 'transparent',
            color: activeTab === 'new_inspection' ? '#ffffff' : '#a1a1aa',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <FileCheck2 size={18} color={activeTab === 'new_inspection' ? '#3b82f6' : '#71717a'} />
          <span>New Inspection</span>
        </button>

        <button
          onClick={() => onSelectTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '6px',
            border: activeTab === 'history' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            backgroundColor: activeTab === 'history' ? '#1b1b1b' : 'transparent',
            color: activeTab === 'history' ? '#ffffff' : '#a1a1aa',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={18} color={activeTab === 'history' ? '#3b82f6' : '#71717a'} />
          <span>Inspection History</span>
        </button>

        {activeTab === 'results' && (
          <button
            onClick={() => onSelectTab('results')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              backgroundColor: '#1b1b1b',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              marginTop: '12px'
            }}
          >
            <ShieldAlert size={18} color="#ef4444" />
            <span>Active Results</span>
          </button>
        )}

        {activeTab === 'recheck' && (
          <button
            onClick={() => onSelectTab('recheck')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              backgroundColor: '#1b1b1b',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              marginTop: '12px'
            }}
          >
            <RotateCcw size={18} color="#06b6d4" />
            <span>Re-Check Lifecycle</span>
          </button>
        )}
      </nav>

      {/* System Status Panel */}
      <div style={{
        padding: '16px',
        margin: '12px',
        backgroundColor: '#121212',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>

          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SYSTEM ENGINES
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: isConnected ? '#10b981' : '#ef4444'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }} />
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} color="#3b82f6" /> FastAPI Backend
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: isConnected ? '#10b981' : '#71717a' }}>
              {isConnected ? '8000 OK' : 'ERR'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} color="#06b6d4" /> Vision Engine
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#10b981' }}>
              YOLOv8
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a1a1aa' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color="#eab308" /> QC Rule Engine
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#10b981' }}>
              v1.0 ACTIVE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
