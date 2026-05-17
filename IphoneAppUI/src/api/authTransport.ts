const AUTH_MODE = (import.meta.env.VITE_AUTH_TRANSPORT || 'mobile').toLowerCase();
const ACCESS_TOKEN_KEY = 'insiderflow_mobile_access_token';
const REFRESH_TOKEN_KEY = 'insiderflow_mobile_refresh_token';

export function isMobileTransport() {
  return AUTH_MODE === 'mobile';
}

export function getAccessToken(): string | null {
  if (!isMobileTransport()) return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isMobileTransport()) return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setMobileTokens(tokens: {
  accessToken?: string;
  refreshToken?: string;
}) {
  if (!isMobileTransport()) return;
  try {
    if (tokens.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    /* ignore */
  }
}

export function clearMobileTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
