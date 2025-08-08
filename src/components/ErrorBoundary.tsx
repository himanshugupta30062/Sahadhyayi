import React from 'react';
import { errorHandler } from '@/utils/errorHandler';
import { ErrorFallback } from '@/components/ErrorFallback';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
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
      const fallback = this.props.fallback ?? <ErrorFallback />;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          {fallback}
        </div>
      );
    }

    return this.props.children;
  }
}
