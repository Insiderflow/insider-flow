"use client";

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

export default function ResponsiveTable<RowT extends object>({ columns, data, className: _className = "", onSort, sortKey, sortOrder }: ResponsiveTableProps<RowT>) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded border border-gray-600 bg-gray-800 shadow-md">
        <table className="min-w-full text-sm" role="table" aria-label="Data table">
          <thead className="sticky top-0 bg-gray-700 border-b border-gray-600 z-10">
            <tr className="text-left">
              {columns.map((col) => (
                <th key={col.key} className="p-2 text-white" scope="col">
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200"
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
          <tbody className="divide-y divide-gray-600">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-700 focus-within:bg-gray-700">
                {columns.map((col) => {
                  const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                  return (
                    <td key={col.key} className="p-2 text-white">
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
          <div key={index} className="border border-gray-600 bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200" role="listitem">
            <div className="space-y-3">
              {columns.map((col) => {
                const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                const isImportant = ['politician', 'issuer', 'name', 'title'].includes(col.key);
                
                return (
                  <div key={col.key} className={`${isImportant ? 'pb-2 border-b border-gray-600' : ''} ${isImportant ? 'mb-3' : 'mb-2'} last:mb-0`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide" aria-label={`${col.label}:`}>
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
