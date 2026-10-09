import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { LogoMark } from './LogoMark';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'TPM',
    teamSize: '50-200'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(59, 130, 246, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#8E8E93',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <LogoMark size="sm" />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
              Book an EAGLE EYE Demo
            </h3>
            <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '24px' }}>
              See how EAGLE EYE provides program memory and agent oversight for your engineering team.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8E8E93', marginBottom: '6px' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sarah Chen"
                  style={{
                    width: '100%',
                    backgroundColor: '#1b1b1b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8E8E93', marginBottom: '6px' }}>
                  WORK EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sarah@company.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#1b1b1b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8E8E93', marginBottom: '6px' }}>
                    YOUR ROLE
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#1b1b1b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="TPM">TPM / Program Lead</option>
                    <option value="EM">Engineering Manager</option>
                    <option value="PM">Product Manager</option>
                    <option value="Exec">VP / CTO / Founder</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8E8E93', marginBottom: '6px' }}>
                    ENGINEERING SIZE
                  </label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#1b1b1b',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="10-50">10-50 engineers</option>
                    <option value="50-200">50-200 engineers</option>
                    <option value="200+">200+ engineers</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Request Demo Access</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={28} color="#10B981" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Demo Request Received!
            </h3>
            <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '24px', lineHeight: 1.5 }}>
              Thanks {formData.name}. Our technical team will reach out to <strong style={{ color: '#FFFFFF' }}>{formData.email}</strong> shortly with your personalized preview.
            </p>

            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#1b1b1b',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
