import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function PageNotFound() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
      {/* Brand mark */}
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <Compass className="h-6 w-6 text-primary" />
      </div>

      {/* 404 number */}
      <p className="text-7xl font-extrabold tabular-nums text-foreground/10 leading-none mb-2">404</p>

      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-1">
        <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{path}</span>
      </p>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        This route doesn't exist in Insider Flow.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary text-foreground text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}