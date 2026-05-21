'use client';

import { useState, useEffect } from 'react';
import { getTranslation, getCurrentLanguage, type Language, type Translations } from '@/lib/translations';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('zh-Hant');

  useEffect(() => {
    const sync = () => setLanguage(getCurrentLanguage());
    sync();
    window.addEventListener('storage', sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('storage', sync);
      observer.disconnect();
    };
  }, []);

  const t = (key: keyof Translations) => {
    return getTranslation(key, language);
  };

  return { t, language };
}

