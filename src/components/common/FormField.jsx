import React from 'react';

/**
 * Reusable FormField component with accessible labels and validation states.
 */
export function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helperText = '',
  options = [], // for select: [{ value, label }]
  rows = 3, // for textarea
  disabled = false,
  className = '',
  ...props
}) {
  const inputBaseStyle =
    'w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700/20 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';
  const borderStyle = error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
    : 'border-slate-300 focus:border-teal-700';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-600" aria-hidden="true">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${inputBaseStyle} ${borderStyle} cursor-pointer`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`${inputBaseStyle} ${borderStyle} resize-y`}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`${inputBaseStyle} ${borderStyle}`}
          {...props}
        />
      )}

      {error ? (
        <p className="text-xs text-rose-600 mt-1" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
