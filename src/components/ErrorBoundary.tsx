import React from 'react';
import { errorHandler } from '@/utils/errorHandler';
import { ErrorFallback } from '@/components/ErrorFallback';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }> {
  state = { hasError: false as boolean, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error('🚨 Uncaught in ErrorBoundary:', error);
    }

    errorHandler.reportCustomError(
      error.message,
      { component: 'ErrorBoundary', action: 'componentDidCatch' },
      'critical'
    );

    // Ensure any persistent loader is removed when an error occurs
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  render() {
    if (this.state.hasError) {
      const defaultFallback = (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
      const fallback = this.props.fallback ?? defaultFallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          {fallback}
        </div>
      );
    }

    return this.props.children;
  }
}
