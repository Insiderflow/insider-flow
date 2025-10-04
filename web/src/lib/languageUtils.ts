export type Language = 'zh-Hant' | 'zh-Hans';

export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-Hant';
  return (localStorage.getItem('language') as Language) || 'zh-Hant';
}

export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('language', language);
  
  // Apply language class to body
  document.body.className = document.body.className.replace(/language-\w+/g, '');
  document.body.classList.add(`language-${language}`);
}

export function initializeLanguage(): void {
  if (typeof window === 'undefined') return;
  
  const currentLanguage = getCurrentLanguage();
  setLanguage(currentLanguage);
}





