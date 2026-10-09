import React from 'react';

export const LogoMarquee: React.FC = () => {
  const logos = [
    'Apple',
    'AWS',
    'TikTok',
    'Google',
    'Box',
    'Microsoft',
    'UC Berkeley'
  ];

  return (
    <section
      style={{
        padding: '36px 0',
        backgroundColor: '#161616',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8E8E93',
            marginBottom: '20px'
          }}
        >
          BUILT BY TEAM FROM
        </p>

        {/* Marquee Loop */}
        <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div className="animate-marquee" style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
            {[...logos, ...logos, ...logos].map((company, index) => (
              <span
                key={index}
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#71717A',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease, color 0.2s ease',
                  cursor: 'default'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.color = '#71717A';
                }}
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
