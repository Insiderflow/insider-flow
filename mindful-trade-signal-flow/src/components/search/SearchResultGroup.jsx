import React from 'react';
import SearchResultRow from './SearchResultRow';

export default function SearchResultGroup({ title, results, onSelect }) {
  if (!results || results.length === 0) return null;

  return (
    <div>
      <div className="px-4 py-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="divide-y divide-border/30">
        {results.map((result, idx) => (
          <SearchResultRow key={idx} result={result} onClick={() => onSelect(result)} />
        ))}
      </div>
    </div>
  );
}