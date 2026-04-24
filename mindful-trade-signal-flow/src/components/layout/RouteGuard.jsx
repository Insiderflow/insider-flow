import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Wraps protected routes. Redirects unauthenticated users to /welcome,
 * preserving the intended destination as `?next=` for post-login redirect.
 */
export default function RouteGuard({ children }) {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/welcome?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return children;
}