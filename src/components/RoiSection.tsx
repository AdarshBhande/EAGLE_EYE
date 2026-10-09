import React, { useState, useEffect } from 'react';
import { Terminal, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface RoiSectionProps {
  onOpenDemo: () => void;
}

export const RoiSection: React.FC<RoiSectionProps> = ({ onOpenDemo }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 1));
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="roi"
      style={{
        padding: '100px 0',
        backgroundColor: '#161616',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        
        {/* Terminal Counter Graphic */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#1b1b1b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '9999px',
            padding: '10px 24px',
            marginBottom: '32px',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)'
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#8E8E93', fontWeight: 700 }}>
            D0 START
          </span>
          <span style={{ color: '#444444' }}>⟶</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#3B82F6', fontWeight: 800 }}>
              [:{progress}%]
            </span>
            <div style={{ width: '60px', height: '4px', backgroundColor: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3B82F6' }}></div>
            </div>
          </div>
          <span style={{ color: '#444444' }}>⟶</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
            D1 DAY ONE
          </span>
        </div>

        {/* Main Title */}
        <h2
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            marginBottom: '20px'
          }}
        >
          Pays for itself on day one.
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '17px',
            color: '#A1A1AA',
            maxWidth: '640px',
            margin: '0 auto 40px auto',
            lineHeight: 1.6
          }}
        >
          Eliminate hours of manual status reports, fragmented Slack updates, and missed scope dependencies. 
          Deploy EAGLE EYE to your quality inspection stack today.
        </p>

        {/* CTA Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onOpenDemo}
            style={{
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px 36px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 40px -5px rgba(59, 130, 246, 0.6)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3B82F6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Get Early Access</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </section>
  );
};
