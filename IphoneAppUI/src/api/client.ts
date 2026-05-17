import { API_BASE_URL } from './config';
import {
  clearMobileTokens,
  getAccessToken,
  getRefreshToken,
  isMobileTransport,
  setMobileTokens,
} from './authTransport';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { params, body, signal } = options;
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(`${API_BASE_URL}${path}`, base);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const accessToken = getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

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

  if (res.status === 401 && isMobileTransport() && !path.includes('/api/mobile/auth/')) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshRes = await fetch(
        new URL(`${API_BASE_URL}/api/mobile/auth/refresh`, base).toString(),
        {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        }
      );
      if (refreshRes.ok) {
        const refreshed = (await refreshRes.json()) as {
          accessToken?: string;
          refreshToken?: string;
        };
        setMobileTokens({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });
        const latest = getAccessToken();
        if (latest) headers.Authorization = `Bearer ${latest}`;
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
      const err = (await res.json()) as {
        code?: string;
        message?: string;
        error?: string;
        details?: string;
      };
      code = err.code ?? code;
      message = err.details ?? err.message ?? err.error ?? message;
    } catch {
      /* non-json */
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal
  ) {
    return request<T>('GET', path, { params, signal });
  },
  post<T>(path: string, body?: unknown, signal?: AbortSignal) {
    return request<T>('POST', path, { body, signal });
  },
  delete<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ) {
    return request<T>('DELETE', path, { params });
  },
};
