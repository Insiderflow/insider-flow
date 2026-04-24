import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function SaveButton({ state, onClick, label = 'Save changes' }) {
  // state: 'idle' | 'saving' | 'saved' | 'error'
  const map = {
    idle:   { text: label,        bg: 'bg-primary',   disabled: false },
    saving: { text: 'Saving…',    bg: 'bg-primary/70', disabled: true },
    saved:  { text: 'Saved ✓',    bg: 'bg-buy',        disabled: true },
    error:  { text: 'Try again',  bg: 'bg-sell',       disabled: false },
  };
  const cfg = map[state] || map.idle;

  return (
    <button
      onClick={onClick}
      disabled={cfg.disabled}
      className={`w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all ${cfg.bg} disabled:opacity-80`}
    >
      {state === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
      {state === 'saved'  && <Check className="h-4 w-4" />}
      {cfg.text}
    </button>
  );
}