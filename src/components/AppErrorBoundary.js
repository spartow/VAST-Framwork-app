import React from 'react';
import './AppErrorBoundary.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card card">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Something Went Wrong</h1>
            <p className="error-message">
              The VAST Framework encountered an unexpected error. 
              This has been logged for investigation.
            </p>
            
            {this.state.error && (
              <details className="error-details">
                <summary className="error-details-summary">
                  Technical Details
                </summary>
                <div className="error-details-content">
                  <div className="error-section">
                    <h3>Error Message:</h3>
                    <pre>{this.state.error.toString()}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className="error-section">
                      <h3>Component Stack:</h3>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleReset} 
                className="btn btn-primary"
              >
                Return to Home
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-secondary"
              >
                Reload Page
              </button>
            </div>

            <div className="error-help">
              <p>
                If this problem persists, please contact support or check the console for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
