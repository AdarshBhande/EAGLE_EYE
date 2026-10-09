import React from 'react';

interface LogoMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 'md', showText = true }) => {
  const iconHeight = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;

  return (
    <div className="inline-flex items-center gap-2.5 cursor-pointer group" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Barcode Ribbed Disc Icon */}
      <div 
        style={{ 
          height: `${iconHeight}px`, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px',
          padding: '2px 4px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <span style={{ width: '3px', height: '100%', backgroundColor: '#3B82F6', borderRadius: '1px' }}></span>
        <span style={{ width: '2px', height: '80%', backgroundColor: '#FFFFFF', borderRadius: '1px' }}></span>
        <span style={{ width: '4px', height: '100%', backgroundColor: '#3B82F6', borderRadius: '1px' }}></span>
        <span style={{ width: '2px', height: '70%', backgroundColor: '#FFFFFF', borderRadius: '1px' }}></span>
        <span style={{ width: '3px', height: '90%', backgroundColor: '#3B82F6', borderRadius: '1px' }}></span>
        <span style={{ width: '2px', height: '60%', backgroundColor: '#8E8E93', borderRadius: '1px' }}></span>
      </div>

      {showText && (
        <span 
          style={{ 
            fontFamily: 'var(--font-sans)', 
            fontWeight: 700, 
            fontSize: size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px',
            letterSpacing: '-0.03em',
            color: '#FFFFFF'
          }}
        >
          EAGLE EYE
        </span>
      )}
    </div>
  );
};
