"use client";

import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number; // Delay before showing spinner (ms)
  className?: string;
}

export default function LoadingWrapper({ 
  children, 
  fallback, 
  delay = 200,
  className = '' 
}: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Show spinner after delay to prevent flash for fast loads
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, delay);

    // Simulate loading completion (in real app, this would be based on actual data loading)
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate 1 second loading time

    return () => {
      clearTimeout(timer);
      clearTimeout(loadingTimer);
    };
  }, [delay]);

  if (isLoading && showSpinner) {
    return (
      <div className={`flex justify-center items-center min-h-[200px] ${className}`}>
        {fallback || <LoadingSpinner size="lg" />}
      </div>
    );
  }

  return <>{children}</>;
}
