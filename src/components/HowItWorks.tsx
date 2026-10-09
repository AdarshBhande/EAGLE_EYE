import React, { useState } from 'react';
import { Database, Zap, Lock, BarChart3, CheckCircle, GitBranch, MessageSquare, Terminal, Eye, Layers } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Connect everything',
      desc: 'Plug into Slack, GitHub, Linear, Jira, Zoom, Notion, and code repositories in 2 minutes.'
    },
    {
      num: '02',
      title: 'Catalog creation',
      desc: 'EAGLE EYE continuously parses tool activity to map commits, tickets, and discussions into active programs.'
    },
    {
      num: '03',
      title: 'Shared state & memory',
      desc: 'Maintain standing context, Program Readmes, decision logs, and ownership across humans and AI agents.'
    },
    {
      num: '04',
      title: 'Program-level automations',
      desc: 'Trigger launch gates, status digests, risk alerts, and deep research on operational cadence.'
    }
  ];

  const fourSystems = [
    {
      id: '01/',
      title: 'Program Memory',
      subtitle: 'Shared state & context persistence',
      desc: 'Single source of truth containing standing context, Program Readmes, decision histories, and PR dependencies for every active initiative.',
      icon: Database,
      tags: ['Program Readme', 'Decision Log', 'Context Graph'],
      accent: '#3B82F6'
    },
    {
      id: '02/',
      title: 'Loops on Programs',
      subtitle: 'Prompt-based triggers & widgets',
      desc: 'Automated operational triggers that run on scheduled cadence or tool events (e.g., Weekly Auth Digest, Launch Gate verification).',
      icon: Zap,
      tags: ['Cadence Digests', 'Launch Gates', 'Slack Alerts'],
      accent: '#EAB308'
    },
    {
      id: '03/',
      title: 'Agent Governance',
      subtitle: 'Collaborative multi-model controls',
      desc: 'Permission controls and activity monitoring for AI coding agents (Claude Code, Codex Agent) working inside program scopes.',
      icon: Lock,
      tags: ['Access Controls', 'Scope Limits', 'Write Approval'],
      accent: '#10B981'
    },
    {
      id: '04/',
      title: 'Program Analytics',
      subtitle: 'Large-scale temporal reasoning',
      desc: 'Comprehensive execution intelligence measuring plan vs. actual velocity, technical debt reduction, and team capacity.',
      icon: BarChart3,
      tags: ['Velocity Benchmarks', 'Drift Tracking', 'Capacity Model'],
      accent: '#EC4899'
    }
  ];

  return (
    <section 
      id="how-it-works"
      style={{ 
        padding: '100px 0', 
        backgroundColor: '#161616',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
            HOW IT WORKS
          </span>
          <h2 
            style={{ 
              fontSize: 'clamp(28px, 4vw, 48px)', 
              fontWeight: 800, 
              color: '#FFFFFF', 
              letterSpacing: '-0.03em', 
              marginTop: '8px' 
            }}
          >
            Four core systems for human-agent execution.
          </h2>
        </div>

        {/* 4-Step Workflow Bar */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '16px', 
            marginBottom: '64px' 
          }}
        >
          {steps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => setActiveStep(idx)}
              style={{
                backgroundColor: activeStep === idx ? '#222222' : '#1b1b1b',
                border: activeStep === idx ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <span 
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', 
                  color: activeStep === idx ? '#3B82F6' : '#8E8E93', 
                  fontWeight: 700 
                }}
              >
                {step.num}.
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginTop: '6px', marginBottom: '6px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', lineHeight: 1.5 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Four Systems Bento Grid Breakdown */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', 
            gap: '24px' 
          }}
        >
          {fourSystems.map((system, idx) => {
            const Icon = system.icon;
            return (
              <div
                key={idx}
                className="card-hover"
                style={{
                  backgroundColor: '#1B1B1B',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Accent Line */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', backgroundColor: system.accent }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{ 
                        padding: '10px', 
                        backgroundColor: `${system.accent}15`, 
                        borderRadius: '8px',
                        border: `1px solid ${system.accent}30`
                      }}
                    >
                      <Icon size={22} color={system.accent} />
                    </div>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: system.accent, fontWeight: 700 }}>
                        {system.id}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                        {system.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, marginBottom: '24px' }}>
                  {system.desc}
                </p>

                {/* Feature Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {system.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '4px 10px',
                        backgroundColor: '#242424',
                        color: '#D4D4D8',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
