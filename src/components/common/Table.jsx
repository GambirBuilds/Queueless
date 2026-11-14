import React from 'react';

/**
 * Reusable Table component adhering to SaaS dashboard guidelines:
 * compact row heights, tabular-nums for numeric columns, single-elevation lines.
 */
export function Table({
  columns = [], // [{ header, accessor, align: 'left'|'right'|'center', render: (row) => node }]
  data = [],
  keyField = 'id',
  emptyMessage = 'No records found.',
  className = '',
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3 px-4 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-slate-500 text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row[keyField] || rowIndex}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {columns.map((col, colIndex) => {
                  const content = col.render ? col.render(row) : row[col.accessor];
                  return (
                    <td
                      key={colIndex}
                      className={`py-3 px-4 ${
                        col.align === 'right'
                          ? 'text-right tabular-nums'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
