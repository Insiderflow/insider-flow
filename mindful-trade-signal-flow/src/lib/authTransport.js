const AUTH_MODE = (import.meta.env.VITE_AUTH_TRANSPORT || 'web').toLowerCase();
const ACCESS_TOKEN_KEY = 'insiderflow_mobile_access_token';
const REFRESH_TOKEN_KEY = 'insiderflow_mobile_refresh_token';

export function isMobileTransport() {
  return AUTH_MODE === 'mobile';
}

export function getAccessToken() {
  if (!isMobileTransport()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!isMobileTransport()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setMobileTokens({ accessToken, refreshToken }) {
  if (!isMobileTransport()) return;
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearMobileTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
