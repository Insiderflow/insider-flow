/** Vite `base` (e.g. `/app/`). Empty in dev without base. */
export function appBasePath(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

/** Absolute path for router + return URLs (includes `/app` when embedded on www). */
export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = appBasePath();
  if (!base || base === "/") return normalized;
  return `${base}${normalized}`;
}

export function appAbsoluteUrl(path: string): string {
  return `${window.location.origin}${appPath(path)}`;
}
