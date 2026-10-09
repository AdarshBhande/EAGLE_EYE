import React, { useState } from 'react';
import { Play, Sparkles, MessageSquare, ShieldAlert, CheckCircle2, ChevronRight, CornerDownLeft, RefreshCw, Cpu, Layers } from 'lucide-react';

interface HeroProps {
  onOpenDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo }) => {
  const [deepResearch, setDeepResearch] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'ontrack'>('all');
  const [promptText, setPromptText] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'EAGLE EYE Agent', time: '09:42 AM', text: 'Scanned 14 PRs in SOC 2 Type 2 program. 2 unmapped auth changes detected in backend repo.', type: 'alert' },
    { sender: 'EAGLE EYE Agent', time: '09:45 AM', text: 'Generated weekly compliance readiness digest for PM sync.', type: 'info' }
  ]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    const userMsg = promptText;
    setPromptText('');
    setChatMessages(prev => [
      ...prev,
      { sender: 'User', time: 'Just now', text: userMsg, type: 'user' },
      { sender: 'EAGLE EYE Agent', time: 'Just now', text: `Analyzing program state across Slack, Linear & GitHub for "${userMsg}"...`, type: 'info' }
    ]);
  };

  const programList = [
    {
      name: 'SOC 2 Type 2 Compliance',
      lead: 'Sarah C. (TPM) + Claude Code',
      progress: 78,
      status: 'RISK DETECTED',
      statusColor: '#EF4444',
      riskCount: 'Δ 3',
      milestones: ['Auth Audit', 'Encryption Gate', 'Audit Prep'],
      category: 'critical'
    },
    {
      name: 'Desktop Agent Architecture (v2.4)',
      lead: 'Alex M. (EM) + Codex Agent',
      progress: 92,
      status: 'ON TRACK',
      statusColor: '#10B981',
      riskCount: 'Δ 0',
      milestones: ['IPC Bridge', 'Perf Bench', 'Release Candidate'],
      category: 'ontrack'
    },
    {
      name: 'Linear & GitHub Realtime Sync Engine',
      lead: 'David K. (Staff Eng) + EAGLE EYE Agent',
      progress: 45,
      status: 'IN PROGRESS',
      statusColor: '#3B82F6',
      riskCount: 'Δ 1',
      milestones: ['Webhook Ingestion', 'Graph DB Schema', 'E2E Tests'],
      category: 'ontrack'
    }
  ];

  const filteredPrograms = programList.filter(p => {
    if (activeTab === 'critical') return p.category === 'critical';
    if (activeTab === 'ontrack') return p.category === 'ontrack';
    return true;
  });

  return (
    <section 
      style={{ 
        position: 'relative', 
        paddingTop: '140px', 
        paddingBottom: '80px',
        overflow: 'hidden'
      }}
      className="bg-blueprint-grid"
    >
      {/* Background Vertical Guidelines */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '1280px',
          height: '100%',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          zIndex: 0
        }}
      >
        <div style={{ width: '1px', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}></div>
        <div style={{ width: '1px', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}></div>
        <div style={{ width: '1px', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}></div>
        <div style={{ width: '1px', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}></div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {/* Eyebrow Pill Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              color: '#3B82F6'
            }}
          >
            <Sparkles size={12} color="#3B82F6" />
            <span>AI-NATIVE PROGRAM MANAGEMENT</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 68px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            lineHeight: 1.08,
            maxWidth: '960px',
            margin: '0 auto 20px auto',
            color: '#FFFFFF'
          }}
        >
          Run your programs with a team of <span className="text-gradient-blue">humans and agents.</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '17px',
            color: '#A1A1AA',
            textAlign: 'center',
            maxWidth: '680px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6
          }}
        >
          EAGLE EYE is the collaborative oversight layer for human-agent engineering execution. 
          Connect GitHub, Linear, Slack, and codebases into unified program memory.
        </p>

        {/* Dual CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '64px' }}>
          <button
            onClick={onOpenDemo}
            style={{
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 30px -5px rgba(59, 130, 246, 0.5)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3B82F6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Book a Demo</span>
            <ChevronRight size={16} />
          </button>

          <button
            onClick={onOpenDemo}
            style={{
              backgroundColor: '#1B1B1B',
              color: '#A1A1AA',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#A1A1AA';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            Sign in
          </button>
        </div>

        {/* Product Hero Mockup Frame */}
        <div
          style={{
            backgroundColor: '#161616',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(59, 130, 246, 0.15)',
            overflow: 'hidden'
          }}
        >
          {/* Dashboard Window Header */}
          <div
            style={{
              backgroundColor: '#1b1b1b',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#8E8E93' }}>eagle-eye://active-programs/oversight-v1</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  backgroundColor: activeTab === 'all' ? '#262626' : 'transparent',
                  color: activeTab === 'all' ? '#FFFFFF' : '#8E8E93',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                ALL (3)
              </button>
              <button
                onClick={() => setActiveTab('critical')}
                style={{
                  backgroundColor: activeTab === 'critical' ? '#262626' : 'transparent',
                  color: activeTab === 'critical' ? '#EF4444' : '#8E8E93',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                RISKS (1)
              </button>
              <button
                onClick={() => setActiveTab('ontrack')}
                style={{
                  backgroundColor: activeTab === 'ontrack' ? '#262626' : 'transparent',
                  color: activeTab === 'ontrack' ? '#10B981' : '#8E8E93',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                ON TRACK (2)
              </button>
            </div>
          </div>

          {/* Main Dashboard Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '0' }}>
            {/* Left Gantt Timeline Panel */}
            <div style={{ padding: '24px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#3B82F6" />
                  Active Program Catalog
                </h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8E8E93' }}>
                  AUTONOMOUS DISCOVERY • LIVE SYNCHRONIZED
                </span>
              </div>

              {/* Program Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPrograms.map((program, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#1f1f1f',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '16px',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>
                          {program.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                          Owner: {program.lead}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${program.statusColor}15`,
                            color: program.statusColor,
                            border: `1px solid ${program.statusColor}30`,
                            fontWeight: 600
                          }}
                        >
                          {program.status}
                        </span>
                        {program.riskCount !== 'Δ 0' && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#EF4444',
                              fontWeight: 700
                            }}
                          >
                            {program.riskCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Milestone Timeline */}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8E8E93', marginBottom: '6px' }}>
                        <span>Sprint Completion</span>
                        <span>{program.progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#2a2a2a', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div
                          style={{
                            width: `${program.progress}%`,
                            height: '100%',
                            backgroundColor: program.statusColor,
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                          }}
                        ></div>
                      </div>

                      {/* Milestone Diamonds */}
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {program.milestones.map((m, mIdx) => (
                          <div key={mIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#A1A1AA' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#EAB308', transform: 'rotate(45deg)', display: 'inline-block' }}></span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right EAGLE EYE Daily Sync Live Chat Feed */}
            <div style={{ backgroundColor: '#141414', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} color="#3B82F6" />
                  EAGLE EYE Daily Sync
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                  LIVE
                </span>
              </div>

              {/* Chat Feed Messages */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: msg.type === 'alert' ? 'rgba(239, 68, 68, 0.08)' : msg.type === 'user' ? 'rgba(59, 130, 246, 0.1)' : '#1b1b1b',
                      border: msg.type === 'alert' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: msg.type === 'alert' ? '#EF4444' : msg.type === 'user' ? '#3B82F6' : '#8E8E93', fontWeight: 600 }}>
                        {msg.sender}
                      </span>
                      <span style={{ color: '#555555' }}>{msg.time}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#D4D4D8', lineHeight: 1.4 }}>
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom Interactive Command Bar */}
              <form onSubmit={handleSendPrompt} style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#8E8E93' }}>Program Control</span>
                  
                  {/* Deep Research Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => setDeepResearch(!deepResearch)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: deepResearch ? 'rgba(59, 130, 246, 0.2)' : '#222222',
                      color: deepResearch ? '#3B82F6' : '#8E8E93',
                      border: deepResearch ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                  >
                    <Cpu size={10} />
                    <span>Deep Research {deepResearch ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: '#1b1b1b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ask EAGLE EYE anything about programs..."
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      width: '100%',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#3B82F6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CornerDownLeft size={12} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
