"use client";

import { useState } from 'react';

interface TableColumn<RowT extends object> {
  key: string;
  label: string;
  render?: (value: unknown, row: RowT) => React.ReactNode;
  sortable?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile display priority
}

interface MobileOptimizedTableProps<RowT extends object> {
  columns: TableColumn<RowT>[];
  data: RowT[];
  className?: string;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  mobileCardTitle?: (row: RowT) => string;
  mobileCardSubtitle?: (row: RowT) => string;
}

export default function MobileOptimizedTable<RowT extends object>({ 
  columns, 
  data, 
  className = "", 
  onSort, 
  sortKey, 
  sortOrder,
  mobileCardTitle,
  mobileCardSubtitle
}: MobileOptimizedTableProps<RowT>) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const getHighPriorityColumns = () => {
    return columns.filter(col => col.priority === 'high' || !col.priority);
  };

  const getMediumPriorityColumns = () => {
    return columns.filter(col => col.priority === 'medium');
  };

  const getLowPriorityColumns = () => {
    return columns.filter(col => col.priority === 'low');
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded border border-gray-600 bg-gray-800 shadow-md">
        <table className="min-w-full text-sm" role="table" aria-label="Data table">
          <thead className="sticky top-0 bg-gray-700 border-b border-gray-600 z-10">
            <tr className="text-left">
              {columns.map((col) => (
                <th key={col.key} className="p-3 text-white" scope="col">
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
                    <td key={col.key} className="p-3 text-white">
                      {col.render ? col.render(value, row) : (value as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet view (md) */}
      <div className="hidden md:block lg:hidden overflow-x-auto rounded border border-gray-600 bg-gray-800 shadow-md">
        <table className="min-w-full text-sm" role="table" aria-label="Data table">
          <thead className="sticky top-0 bg-gray-700 border-b border-gray-600 z-10">
            <tr className="text-left">
              {getHighPriorityColumns().map((col) => (
                <th key={col.key} className="p-3 text-white" scope="col">
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
                {getHighPriorityColumns().map((col) => {
                  const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                  return (
                    <td key={col.key} className="p-3 text-white">
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
      <div className="md:hidden space-y-3" role="list" aria-label="Data list">
        {data.map((row, index) => {
          const isExpanded = expandedCards.has(index);
          const highPriorityCols = getHighPriorityColumns();
          const mediumPriorityCols = getMediumPriorityColumns();
          const lowPriorityCols = getLowPriorityColumns();
          
          return (
            <div key={index} className="border border-gray-600 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" role="listitem">
              {/* Card Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                onClick={() => toggleCard(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {mobileCardTitle ? (
                      <div className="text-white font-semibold text-base truncate">
                        {mobileCardTitle(row)}
                      </div>
                    ) : (
                      <div className="text-white font-semibold text-base truncate">
                        {highPriorityCols[0] && (() => {
                          const value = (row as unknown as Record<string, unknown>)[highPriorityCols[0].key] as unknown;
                          return highPriorityCols[0].render ? highPriorityCols[0].render(value, row) : (value as React.ReactNode);
                        })()}
                      </div>
                    )}
                    {mobileCardSubtitle && (
                      <div className="text-sm text-gray-300 mt-1 truncate">
                        {mobileCardSubtitle(row)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {/* Show key stats */}
                    {highPriorityCols.slice(1, 3).map((col) => {
                      const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                      return (
                        <div key={col.key} className="text-right">
                          <div className="text-xs text-gray-400">{col.label}</div>
                          <div className="text-sm text-white font-medium">
                            {col.render ? col.render(value, row) : (value as React.ReactNode)}
                          </div>
                        </div>
                      );
                    })}
                    <button className="text-gray-400 hover:text-white transition-colors duration-200">
                      <svg 
                        className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-600">
                  <div className="pt-3 space-y-3">
                    {/* Medium priority columns */}
                    {mediumPriorityCols.map((col) => {
                      const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                      return (
                        <div key={col.key} className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            {col.label}
                          </span>
                          <div className="text-sm text-white text-right">
                            {col.render ? col.render(value, row) : (value as React.ReactNode)}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Low priority columns */}
                    {lowPriorityCols.map((col) => {
                      const value = (row as unknown as Record<string, unknown>)[col.key] as unknown;
                      return (
                        <div key={col.key} className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            {col.label}
                          </span>
                          <div className="text-sm text-white text-right">
                            {col.render ? col.render(value, row) : (value as React.ReactNode)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
