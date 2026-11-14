import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.'
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[QUEUELESS ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              The interface encountered an unexpected error. Your saved queue tokens and appointments remain safe in Cloud Firestore.
            </p>
            {this.state.errorMessage && (
              <div className="p-2.5 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-600 break-words">
                {this.state.errorMessage}
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Try Recovering
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
