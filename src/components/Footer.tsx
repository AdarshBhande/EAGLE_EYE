import React from 'react';
import { LogoMark } from './LogoMark';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#121212',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '60px 0 40px 0'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Top Waveform / Barcode Motif Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px', opacity: 0.3 }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i % 5 === 0 ? '3px' : '1px',
                height: `${(i % 7) * 4 + 8}px`,
                backgroundColor: i % 3 === 0 ? '#3B82F6' : '#FFFFFF'
              }}
            ></div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div>
            <LogoMark size="sm" />
            <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '12px' }}>
              AI Vision System for Control Cabinet Quality Inspection.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <a href="#" style={{ color: '#8E8E93', textDecoration: 'none' }} onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')} onMouseOut={(e) => (e.currentTarget.style.color = '#8E8E93')}>Privacy</a>
            <a href="#" style={{ color: '#8E8E93', textDecoration: 'none' }} onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')} onMouseOut={(e) => (e.currentTarget.style.color = '#8E8E93')}>Terms</a>
            <a href="#" style={{ color: '#8E8E93', textDecoration: 'none' }} onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')} onMouseOut={(e) => (e.currentTarget.style.color = '#8E8E93')}>Security</a>
            <a href="#" style={{ color: '#10B981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              Systems Operational
            </a>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '32px', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555555' }}>
          <span>© {new Date().getFullYear()} EAGLE EYE Inspection Systems. All rights reserved.</span>
          <span>San Francisco, CA</span>
        </div>

      </div>
    </footer>
  );
};
