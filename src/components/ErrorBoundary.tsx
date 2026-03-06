// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Error Boundary
// Catches React render errors and shows a recovery UI instead of a blank screen.
// ═══════════════════════════════════════════════════════════════════════════════

import { analytics } from '@lib/analytics';
import { createLogger } from '@lib/logger';
import { Component, type ErrorInfo, type ReactNode } from 'react';

const log = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('Unhandled render error', { error: error.message, stack: info.componentStack });
    analytics.errorOccurred(this.props.scope ?? 'unknown', error.message);
    this.setState({ errorInfo: info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <DefaultErrorUI
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

function DefaultErrorUI({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const isDev = (import.meta as any).env?.DEV;
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      style={{ background: '#040610' }}
    >
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <span className="text-3xl">⚡</span>
      </div>

      <h1 className="text-2xl font-black text-white mb-2">Something crashed</h1>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-6">
        An unexpected error occurred. Your progress is saved automatically — just reload or tap below.
      </p>

      {/* Dev-only error details */}
      {isDev && error && (
        <pre
          className="w-full max-w-sm text-left text-[10px] font-mono text-red-400 bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-6 overflow-x-auto"
        >
          {error.message}
        </pre>
      )}

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-2xl font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'white' }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 rounded-2xl font-black text-sm"
          style={{ background: '#00f0ff', color: '#040610' }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
