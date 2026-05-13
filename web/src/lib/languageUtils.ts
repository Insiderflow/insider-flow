export type Language = 'zh-Hant' | 'zh-Hans';

export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-Hant';
  try {
    const value = localStorage.getItem('language');
    return value === 'zh-Hans' ? 'zh-Hans' : 'zh-Hant';
  } catch {
    return 'zh-Hant';
  }
}

export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('language', language);
  } catch {
    // Ignore storage failures (e.g., privacy mode / restricted storage)
  }

  // Apply language class to body
  const currentClassName = document.body.className || '';
  document.body.className = currentClassName.replace(/language-[^\s]+/g, '').trim();
  document.body.classList.add(`language-${language}`);
  document.documentElement.lang = language === 'zh-Hans' ? 'zh-CN' : 'zh-Hant';
}

export function initializeLanguage(): void {
  if (typeof window === 'undefined') return;

  const currentLanguage = getCurrentLanguage();
  setLanguage(currentLanguage);
}



























