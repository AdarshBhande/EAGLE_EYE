import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EAGLE EYE Error Boundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#121212',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#1e1e24',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '2.5rem',
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              System Workstation Notice
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              An unexpected runtime error occurred while rendering the workstation. This is usually caused by outdated browser session cache.
            </p>
            <div style={{
              backgroundColor: '#09090b',
              padding: '1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#f87171',
              marginBottom: '1.5rem',
              wordBreak: 'break-word',
              textAlign: 'left'
            }}>
              {this.state.error?.message || 'Unknown Error'}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              🔄 Reset Storage & Reload Workstation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
