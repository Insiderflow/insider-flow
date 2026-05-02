export const SUPPORTED_LANGUAGES = ['en', 'zh-Hant', 'zh-Hans'];

export function getCurrentLanguage() {
  if (typeof window === 'undefined') return 'en';
  const raw = window.localStorage.getItem('language');
  if (!raw) return 'en';
  if (!SUPPORTED_LANGUAGES.includes(raw)) return 'en';
  return raw;
}

export function setCurrentLanguage(language) {
  if (typeof window === 'undefined') return;
  if (!SUPPORTED_LANGUAGES.includes(language)) return;
  window.localStorage.setItem('language', language);
}

