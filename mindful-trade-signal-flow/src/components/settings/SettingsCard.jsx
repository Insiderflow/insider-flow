import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SettingsCard({ icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary/10', title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4"
      >
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className="flex-1 text-left text-sm font-semibold">{title}</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/30 pt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}