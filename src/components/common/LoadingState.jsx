import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable LoadingState component
 */
export function LoadingState({ message = 'Loading details...', rows = 3 }) {
  return (
    <div className="py-8 px-4 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
        <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
        <span>{message}</span>
      </div>
      <div className="space-y-3 max-w-xl mx-auto">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
