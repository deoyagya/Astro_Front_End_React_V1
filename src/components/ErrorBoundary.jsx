/**
 * ErrorBoundary — Global React error boundary.
 *
 * Catches render-phase exceptions so the app shows a themed fallback UI
 * instead of crashing to a white screen.
 *
 * Usage: Wrap <App /> in main.jsx:
 *   <ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary>
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console (placeholder for future Sentry/LogRocket integration)
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0f1a',
          color: '#e8dff5',
          fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
          padding: 24,
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: 480,
            background: 'linear-gradient(135deg, #1a1d2e 0%, #141726 100%)',
            border: '1px solid #2a2f3e',
            borderRadius: 16,
            padding: '48px 32px',
          }}>
            <i
              className="fas fa-exclamation-triangle"
              style={{ fontSize: '2.5rem', color: '#ff5252', marginBottom: 20, display: 'block' }}
            ></i>
            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '1.4rem',
              marginBottom: 12,
              color: '#e8dff5',
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: '#8892a4',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              We encountered an unexpected error. Please try refreshing the page.
              If the problem persists, contact support.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #7b5bff 0%, #9d7bff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#9d7bff',
                  border: '1px solid #2a2f3e',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
