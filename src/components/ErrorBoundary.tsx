import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary component.
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire app (blank screen).
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
          super(props);
          this.state = { hasError: false, error: null };
    }

  static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
        window.location.reload();
  };

  render(): ReactNode {
        if (this.state.hasError) {
                if (this.props.fallback) {
                          return this.props.fallback;
                }

          return (
                    <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '100vh',
                                backgroundColor: '#0f172a',
                                color: '#e2e8f0',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                padding: '2rem',
                                textAlign: 'center',
                    }}>
                                <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>
                                              Something went wrong
                                </h1>h1>
                                <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#94a3b8', maxWidth: '500px' }}>
                                              The application encountered an unexpected error. Please try reloading the page.
                                </p>p>
                      {process.env.NODE_ENV === 'development' && this.state.error && (
                                  <pre style={{
                                                  backgroundColor: '#1e293b',
                                                  padding: '1rem',
                                                  borderRadius: '0.5rem',
                                                  fontSize: '0.75rem',
                                                  color: '#f87171',
                                                  maxWidth: '600px',
                                                  overflow: 'auto',
                                                  marginBottom: '1.5rem',
                                                  textAlign: 'left',
                                  }}>
                                    {this.state.error.message}
                                  </pre>pre>
                                )}
                                <button
                                              onClick={this.handleReload}
                                              style={{
                                                              backgroundColor: '#6366f1',
                                                              color: '#ffffff',
                                                              border: 'none',
                                                              padding: '0.75rem 2rem',
                                                              borderRadius: '0.5rem',
                                                              fontSize: '1rem',
                                                              cursor: 'pointer',
                                              }}
                                            >
                                            Reload Page
                                </button>button>
                    </div>div>
                  );
        }
    
        return this.props.children;
  }
}

export default ErrorBoundary;</button>
