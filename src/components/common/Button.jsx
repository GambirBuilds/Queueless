import React from 'react';

/**
 * Reusable Button component adhering to design tokens:
 * py-2 px-4 math, whitespace-nowrap, single-line, accessible focus ring.
 */
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  title,
  ariaLabel,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3 gap-1.5',
    md: 'text-sm py-2 px-4 gap-2',
    lg: 'text-base py-2.5 px-5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700 shadow-sm active:bg-teal-900',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900 shadow-sm',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-teal-700',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-slate-600',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}
