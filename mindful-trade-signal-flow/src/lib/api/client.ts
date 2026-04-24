/**
 * Insider Flow — HTTP API Client
 * ─────────────────────────────────────────────────────────────
 * Thin fetch wrapper used by endpoints.ts.
 * - Uses cookie-based auth (`credentials: include`)
 * - Returns typed responses
 * - Throws ApiError on non-2xx
 * - All paths are relative so the base URL is swappable via env
 */

import {
  clearMobileTokens,
  getAccessToken,
  getRefreshToken,
  isMobileTransport,
  setMobileTokens,
} from '@/lib/authTransport';
const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

// ─────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─────────────────────────────────────────────
// Core request helper
// ─────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { params, body, signal } = options;

  // Build URL
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  async function doFetch() {
    return fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      credentials: 'include',
    });
  }

  let res = await doFetch();

  // Mobile transport: one refresh attempt on 401 before surfacing error.
  if (res.status === 401 && isMobileTransport() && !path.includes('/api/mobile/auth/')) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshRes = await fetch(
        new URL(`${BASE_URL}/api/mobile/auth/refresh`, window.location.origin).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        },
      );
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setMobileTokens({
          accessToken: refreshed?.accessToken,
          refreshToken: refreshed?.refreshToken,
        });
        const latestAccessToken = getAccessToken();
        if (latestAccessToken) {
          headers.Authorization = `Bearer ${latestAccessToken}`;
        }
        res = await doFetch();
      } else {
        clearMobileTokens();
      }
    }
  }

  if (!res.ok) {
    let code = 'unknown_error';
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json() as { code?: string; message?: string; error?: string };
      code = err.code ?? code;
      message = err.message ?? err.error ?? message;
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, code, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Convenience verbs
// ─────────────────────────────────────────────

export const apiClient = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
  ): Promise<T> {
    return request<T>('GET', path, { params, signal });
  },

  post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>('POST', path, { body, signal });
  },

  delete<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> {
    return request<T>('DELETE', path, { params });
  },
};