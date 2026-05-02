import React from 'react';

export default function ChipFilter({ options, value, onChange, allLabel = 'All' }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 tap-chip ${
          value === 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
        }`}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-shrink-0 tap-chip ${
            value === option.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}