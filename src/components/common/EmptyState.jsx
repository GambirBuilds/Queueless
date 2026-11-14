import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Reusable EmptyState component
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records matching your request at this time.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-200 rounded-xl bg-white ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
