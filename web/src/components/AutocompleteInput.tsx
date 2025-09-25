"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  placeholder?: string;
  initialValue?: string;
  searchPath: string; // API path for suggestions
  ariaLabel?: string; // ARIA label for accessibility
};

export default function AutocompleteInput({ name, placeholder, initialValue = "", searchPath, ariaLabel }: Props) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const q = value.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${searchPath}?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) return;
        const data: { names: string[] } = await res.json();
        setSuggestions(data.names.slice(0, 10));
        setOpen(true);
      } catch {}
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [value, searchPath]);

  return (
    <div className="relative" ref={boxRef}>
      <input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => value && setOpen(true)}
        placeholder={placeholder}
        className="border border-gray-600 p-1 flex-1 bg-gray-800 text-white placeholder-gray-400 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
        autoComplete="off"
        aria-label={ariaLabel}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-[200px] overflow-y-auto bg-white border border-[#E0E0E0] rounded shadow">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-[#333333] hover:bg-[#F5F5F5] focus:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


