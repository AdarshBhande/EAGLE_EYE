import React from 'react';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header style={{
      height: '64px',
      backgroundColor: '#161616',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0
    }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '4px',
          backgroundColor: '#1b1b1b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#a1a1aa'
        }}>
          <Terminal size={14} color="#3b82f6" />
          <span>ENV: DEVELOPMENT</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '4px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '12px',
          color: '#10b981',
          fontWeight: 500
        }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>INDUSTRIAL READY</span>
        </div>
      </div>
    </header>
  );
}
