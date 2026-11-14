import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Reusable ErrorBanner component
 */
export function ErrorBanner({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-sm font-semibold text-rose-900">{title}</h5>
          <p className="text-xs text-rose-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
          Retry
        </Button>
      )}
    </div>
  );
}
