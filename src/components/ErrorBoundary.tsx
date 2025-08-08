import React from 'react';
import { errorHandler } from '@/utils/errorHandler';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    errorHandler.reportCustomError(
      error.message,
      { component: 'ErrorBoundary', action: 'componentDidCatch' },
      'critical'
    );
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4">Something went wrong. <button onClick={() => location.reload()}>Reload</button></div>
      );
    }
    return this.props.children;
  }
}
