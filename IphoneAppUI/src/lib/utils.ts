import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatCurrencyExact(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function formatPct(value: number, signed = true): string {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatShares(shares: number, zeroLabel?: string): string {
  if (!shares || shares <= 0) return zeroLabel ?? "0 sh";
  if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(1)}M sh`;
  if (shares >= 1_000) return `${(shares / 1_000).toFixed(0)}K sh`;
  return `${shares.toLocaleString()} sh`;
}
