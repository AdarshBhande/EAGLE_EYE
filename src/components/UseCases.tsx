import React, { useState } from 'react';
import { Users, Code, Compass, Award, Check } from 'lucide-react';

export const UseCases: React.FC = () => {
  const [activePersona, setActivePersona] = useState(0);

  const personas = [
    {
      role: 'Engineering Manager',
      short: 'EM',
      title: 'Real-time team velocity without status-chasing meetings.',
      quote: 'I used to spend 8 hours a week checking PRs, Jira tickets, and asking engineers for status. Now EAGLE EYE maintains the live state automatically.',
      bulletPoints: [
        'Automated PR & commit aggregation across repos',
        'Identify blocked developers before sprint review',
        'Human + AI agent workload distribution visibility'
      ]
    },
    {
      role: 'Product Manager',
      short: 'PM',
      title: 'Seamless alignment between feature scope & actual code.',
      quote: 'EAGLE EYE connects customer commitments in Notion/Linear directly to code execution, alerting us when technical decisions alter product timelines.',
      bulletPoints: [
        'Live feature launch readiness checklists',
        'Automatic spec-to-PR drift detection',
        'Instant AI query answers for executive status requests'
      ]
    },
    {
      role: 'Technical Program Manager',
      short: 'TPM',
      title: 'Purpose-built operating system for multi-team execution.',
      quote: 'EAGLE EYE is the first platform built specifically for TPMs to govern complex, agentic engineering programs at scale.',
      bulletPoints: [
        'Program Memory with standing architectural readmes',
        'Automated compliance, security, & release launch gates',
        'Multi-model agent delegation with explicit governance'
      ]
    }
  ];

  return (
    <section
      id="use-cases"
      style={{
        padding: '100px 0',
        backgroundColor: '#121212',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#3B82F6',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700
            }}
          >
            BUILT FOR AI-NATIVE ROLES
          </span>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginTop: '8px'
            }}
          >
            Empower every leader across the engineering org.
          </h2>
        </div>

        {/* Persona Tabs Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          {personas.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePersona(idx)}
              style={{
                backgroundColor: activePersona === idx ? '#3B82F6' : '#1b1b1b',
                color: activePersona === idx ? '#FFFFFF' : '#A1A1AA',
                border: activePersona === idx ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', opacity: 0.8 }}>
                [{p.short}]
              </span>
              <span>{p.role}</span>
            </button>
          ))}
        </div>

        {/* Active Persona Card Display */}
        <div
          style={{
            backgroundColor: '#1B1B1B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '900px',
            margin: '0 auto'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#3B82F6', fontWeight: 700 }}>
                PERSPECTIVE // {personas[activePersona].role.toUpperCase()}
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginTop: '8px', marginBottom: '16px' }}>
                "{personas[activePersona].title}"
              </h3>
              
              <blockquote style={{ fontSize: '15px', color: '#A1A1AA', fontStyle: 'italic', marginBottom: '24px', paddingLeft: '16px', borderLeft: '2px solid #3B82F6' }}>
                {personas[activePersona].quote}
              </blockquote>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {personas[activePersona].bulletPoints.map((point, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="#3B82F6" />
                    </div>
                    <span style={{ fontSize: '14px', color: '#D4D4D8' }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
