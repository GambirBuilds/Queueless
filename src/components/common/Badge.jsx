import React from 'react';

/**
 * Reusable Badge component.
 * Adheres to Zero-Pill discipline: no candy-coated capsules; subtle unboxed status styling with high legibility.
 */
export function Badge({
  children,
  variant = 'neutral', // 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'teal'
  className = '',
  dot = true,
}) {
  const styles = {
    neutral: 'text-slate-600 bg-slate-100 border border-slate-200',
    success: 'text-emerald-800 bg-emerald-50 border border-emerald-200',
    warning: 'text-amber-800 bg-amber-50 border border-amber-200',
    danger: 'text-rose-800 bg-rose-50 border border-rose-200',
    info: 'text-blue-800 bg-blue-50 border border-blue-200',
    teal: 'text-teal-900 bg-teal-50 border border-teal-200',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    info: 'bg-blue-600',
    teal: 'bg-teal-700',
  };

  const resolvedStyle = styles[variant] || styles.neutral;
  const resolvedDot = dotColors[variant] || dotColors.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-md whitespace-nowrap ${resolvedStyle} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${resolvedDot}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
