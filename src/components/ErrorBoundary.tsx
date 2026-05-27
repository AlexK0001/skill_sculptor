'use client';
import React, { Component, ErrorInfo } from 'react';

export class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  state: { hasError: boolean; error?: Error } = { hasError: false, error: undefined };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('ErrorBoundary caught:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center p-4">
          <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm font-mono break-words">{this.state.error?.toString()}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
