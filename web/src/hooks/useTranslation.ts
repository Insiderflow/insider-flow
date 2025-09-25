'use client';

import { useState, useEffect } from 'react';
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/translations';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('zh-Hant');

  useEffect(() => {
    setLanguage(getCurrentLanguage());
  }, []);

  const t = (key: string) => {
    return getTranslation(key as keyof typeof translations, language);
  };

  return { t, language };
}

