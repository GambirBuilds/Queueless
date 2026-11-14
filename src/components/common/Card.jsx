import React from 'react';

/**
 * Reusable Card component adhering to single-elevation depth guidelines.
 */
export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'p-6',
  ...props
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 transition-all ${
        hoverable || isClickable
          ? 'hover:border-slate-300 hover:shadow-sm cursor-pointer'
          : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
