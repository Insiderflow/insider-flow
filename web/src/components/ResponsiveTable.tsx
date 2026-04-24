"use client";
import {
  mobileMetaLabelStyles,
  mobileTableCardStyles,
  tableBodyStyles,
  tableCellStyles,
  tableHeaderCellStyles,
  tableHeaderRowStyles,
  tableHeaderStyles,
  tableRowStyles,
  tableSortButtonStyles,
  tableWrapperStyles,
} from './tableStyles';

interface TableColumn<RowT extends object> {
  key: string;
  label: string;
  render?: (value: unknown, row: RowT) => React.ReactNode;
  sortable?: boolean;
}

interface ResponsiveTableProps<RowT extends object> {
  columns: TableColumn<RowT>[];
  data: RowT[];
  className?: string;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function ResponsiveTable<RowT extends object>({ columns, data, className: _className = "", onSort, sortKey, sortOrder }: ResponsiveTableProps<RowT>) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <>
      {/* Desktop table */}
      <div className={`hidden sm:block ${tableWrapperStyles()}`}>
        <table className="min-w-full text-sm" role="table" aria-label="Data table">
          <thead className={tableHeaderStyles()}>
            <tr className={tableHeaderRowStyles()}>
              {columns.map((col) => (
                <th key={col.key} className={tableHeaderCellStyles()} scope="col">
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className={tableSortButtonStyles()}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableBodyStyles()}>
            {data.map((row, index) => (
              <tr key={index} className={tableRowStyles()}>
                {columns.map((col) => {
                  const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                  return (
                    <td key={col.key} className={tableCellStyles()}>
                      {col.render ? col.render(value, row) : (value as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3" role="list" aria-label="Data list">
        {data.map((row, index) => (
          <div key={index} className={`${mobileTableCardStyles()} p-4`} role="listitem">
            <div className="space-y-3">
              {columns.map((col) => {
                const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                const isImportant = ['politician', 'issuer', 'name', 'title'].includes(col.key);
                
                return (
                  <div key={col.key} className={`${isImportant ? 'pb-2 border-b border-gray-600' : ''} ${isImportant ? 'mb-3' : 'mb-2'} last:mb-0`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className={mobileMetaLabelStyles()} aria-label={`${col.label}:`}>
                        {col.label}
                      </span>
                      <div className={`text-sm text-white ${isImportant ? 'font-semibold text-base' : ''}`}>
                        {col.render ? col.render(value, row) : (value as React.ReactNode)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
