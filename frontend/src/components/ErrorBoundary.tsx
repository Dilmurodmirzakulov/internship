import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container-xxl flex-grow-1 container-p-y">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="mb-4">
                    <i
                      className="bx bx-error-circle text-danger"
                      style={{ fontSize: '4rem' }}
                    ></i>
                  </div>
                  <h4 className="text-danger mb-3">Something went wrong!</h4>
                  <p className="text-muted mb-4">
                    We're sorry, but something unexpected happened. Please try
                    refreshing the page.
                  </p>
                  {this.state.error && (
                    <details className="text-start">
                      <summary className="text-muted">Error Details</summary>
                      <pre
                        className="mt-2 p-3 bg-light rounded"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
