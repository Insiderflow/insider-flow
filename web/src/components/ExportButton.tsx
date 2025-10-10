'use client';

import { useState } from 'react';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  className?: string;
}

export default function ExportButton({ data, filename = 'insider-trades', className = '' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Get headers from first row
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        // Headers
        headers.join(','),
        // Data rows
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle null/undefined values
            if (value === null || value === undefined) return '';
            // Escape commas and quotes in values
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={isExporting || !data || data.length === 0}
      className={`inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors duration-200 ${className}`}
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="zh-Hant">匯出中...</span>
          <span className="zh-Hans hidden">导出中...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="zh-Hant">匯出 CSV</span>
          <span className="zh-Hans hidden">导出 CSV</span>
        </>
      )}
    </button>
  );
}



