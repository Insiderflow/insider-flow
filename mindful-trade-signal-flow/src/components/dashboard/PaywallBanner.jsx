import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X } from 'lucide-react';

export default function PaywallBanner({ onDismiss }) {
  const navigate = useNavigate();
  return (
    <div className="mx-4 rounded-xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-primary fill-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            Upgrade to Pro
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Real-time alerts, full trade history, and committee conflict scores.
          </p>
          <button
            onClick={() => navigate('/paywall')}
            className="mt-3 w-full bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Start Free Trial →
          </button>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}