"use client";

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
}

export default function SkeletonLoader({ 
  className = "", 
  lines = 1, 
  height = "h-4", 
  width = "w-full" 
}: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-700 rounded ${height} ${width} ${
            index < lines - 1 ? 'mb-2' : ''
          }`}
        />
      ))}
    </div>
  );
}

// Specific skeleton components for different use cases
export function PoliticianCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-md overflow-hidden">
      {/* Header with party color */}
      <div className="h-2 bg-gray-700"></div>
      
      {/* Profile section */}
      <div className="p-4 text-center">
        {/* Profile picture skeleton */}
        <div className="w-16 h-16 mx-auto mb-3 bg-gray-700 rounded-full"></div>
        
        {/* Name skeleton */}
        <div className="h-6 bg-gray-700 rounded mb-1 w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
      </div>
      
      {/* Stats grid skeleton */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="h-6 bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-6 bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
          </div>
          <div className="text-center col-span-2">
            <div className="h-6 bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
        
        {/* Last trade date skeleton */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-center">
            <div className="h-3 bg-gray-700 rounded w-1/3 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-gray-600 bg-gray-800 rounded shadow-md">
      <div className="p-4">
        {/* Table header skeleton */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-700 rounded"></div>
          ))}
        </div>
        
        {/* Table rows skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 gap-4 mb-3">
            {Array.from({ length: 6 }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
    </div>
  );
}

export function IssuerCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>
  );
}
