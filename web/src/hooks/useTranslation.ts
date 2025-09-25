'use client';

import { useState, useEffect } from 'react';
import { getTranslation, getCurrentLanguage, type Language, type Translations } from '@/lib/translations';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('zh-Hant');

  useEffect(() => {
    setLanguage(getCurrentLanguage());
  }, []);

  const t = (key: keyof Translations) => {
    return getTranslation(key, language);
  };

  return { t, language };
}

