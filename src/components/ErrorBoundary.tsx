
import React from 'react';
// import { logError } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Secure logging with sanitized data (temporarily disabled)
    if (process.env.NODE_ENV === 'development') {
      console.error('Component error caught by boundary:', {
        error: error.message,
        stack: error.stack?.substring(0, 1000),
        componentStack: errorInfo.componentStack?.substring(0, 500)
      });
    }
    
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded transition-colors duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                >
                  Refresh Page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">Error Details (Dev Only)</summary>
                  <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded max-h-32 overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="mt-4 text-sm text-gray-500">
                If the problem persists, please contact support.
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
