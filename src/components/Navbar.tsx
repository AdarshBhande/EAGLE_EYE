import React, { useState, useEffect } from 'react';
import { LogoMark } from './LogoMark';

interface NavbarProps {
  onOpenDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'rgba(18, 18, 18, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
        padding: '16px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Left */}
        <a href="#" style={{ textDecoration: 'none' }}>
          <LogoMark />
        </a>

        {/* Center Navigation Menu with Dot Separators */}
        <nav
          className="hidden-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(27, 27, 27, 0.7)',
            padding: '6px 16px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <a
            href="#how-it-works"
            style={{
              color: '#A1A1AA',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              padding: '4px 8px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#A1A1AA')}
          >
            How It Works
          </a>
          <span style={{ color: '#444444', fontSize: '10px' }}>•</span>
          <a
            href="#why-eagle-eye"
            style={{
              color: '#A1A1AA',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              padding: '4px 8px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#A1A1AA')}
          >
            Why EAGLE EYE
          </a>
          <span style={{ color: '#444444', fontSize: '10px' }}>•</span>
          <a
            href="#use-cases"
            style={{
              color: '#A1A1AA',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              padding: '4px 8px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#A1A1AA')}
          >
            Use Cases
          </a>
          <span style={{ color: '#444444', fontSize: '10px' }}>•</span>
          <a
            href="#roi"
            style={{
              color: '#A1A1AA',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              padding: '4px 8px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#A1A1AA')}
          >
            Resources
          </a>
        </nav>

        {/* Right Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 14px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#A1A1AA')}
          >
            Sign in
          </button>
          
          <button
            onClick={onOpenDemo}
            style={{
              backgroundColor: '#1b1b1b',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#262626';
              e.currentTarget.style.borderColor = '#3B82F6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1b1b1b';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
            }}
          >
            <span>Book a Demo</span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>→</span>
          </button>
        </div>
      </div>
    </header>
  );
};
