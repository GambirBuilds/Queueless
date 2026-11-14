import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable SearchInput component
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  autoFocus = false,
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
