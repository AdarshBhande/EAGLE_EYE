import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const [hoverPoint, setHoverPoint] = useState<string | null>(null);

  return (
    <section 
      id="why-eagle-eye"
      style={{ 
        padding: '100px 0', 
        backgroundColor: '#121212',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '60px', alignItems: 'center' }}>
          
          {/* Left Column Text Narrative */}
          <div>
            <div
              style={{
                display: 'inline-block',
                color: '#3B82F6',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}
            >
              THE BOTTLENECK CHANGED
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: '#FFFFFF',
                marginBottom: '24px'
              }}
            >
              AI increased speed — and what drift costs your org.
            </h2>

            <p
              style={{
                fontSize: '16px',
                color: '#A1A1AA',
                lineHeight: 1.6,
                marginBottom: '24px'
              }}
            >
              Individual developers and coding agents generate software at unprecedented velocity. 
              However, program coordination, cross-team alignment, risk management, and dependency tracking remain stuck in manual meetings and scattered docs.
            </p>

            <div
              style={{
                backgroundColor: '#1b1b1b',
                borderLeft: '3px solid #3B82F6',
                padding: '16px 20px',
                borderRadius: '0 8px 8px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} color="#F59E0B" />
                The Organizational Drift Gap
              </h4>
              <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
                When output scales 10x while program coordination stays linear, teams experience silent specification drift, redundant PRs, and late-stage audit blockers.
              </p>
            </div>
          </div>

          {/* Right Column Interactive Chart Component */}
          <div
            style={{
              backgroundColor: '#181818',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '28px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8E8E93', textTransform: 'uppercase' }}>
                  Execution Trajectory Model
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  Velocity vs. Coordination Gap
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                MODEL SR-2
              </span>
            </div>

            {/* Interactive SVG Exponential Chart */}
            <div style={{ position: 'relative', height: '240px', width: '100%', marginBottom: '20px' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                {/* Shaded Drift Area */}
                <path
                  d="M 20 180 Q 200 170 380 40 L 380 160 Q 200 175 20 180 Z"
                  fill="url(#driftGradient)"
                  opacity="0.4"
                />

                {/* AI Output Exponential Line (Blue) */}
                <path
                  d="M 20 180 Q 200 170 380 40"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                />

                {/* EAGLE EYE Alignment Curve (White) */}
                <path
                  d="M 20 180 Q 200 175 380 55"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />

                {/* Manual AI Coordination Line (Gray) */}
                <path
                  d="M 20 180 Q 200 175 380 160"
                  fill="none"
                  stroke="#555555"
                  strokeWidth="2"
                />

                {/* Target Marker Points */}
                <circle cx="380" cy="40" r="5" fill="#3B82F6" onMouseEnter={() => setHoverPoint('output')} />
                <circle cx="380" cy="160" r="5" fill="#555555" onMouseEnter={() => setHoverPoint('traditional')} />
                <circle cx="380" cy="55" r="5" fill="#FFFFFF" onMouseEnter={() => setHoverPoint('eagle-eye')} />

                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Chart Legend Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#3B82F6', borderRadius: '2px' }}></span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>AI Output</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#FFFFFF', borderRadius: '2px' }}></span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#A1A1AA' }}>EAGLE EYE Layer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#555555', borderRadius: '2px' }}></span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#71717A' }}>Legacy Ops</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
