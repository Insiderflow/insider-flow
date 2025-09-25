'use client';

import { useEffect } from 'react';
import { initializeLanguage } from '@/lib/languageUtils';

export default function LanguageInitializer() {
  useEffect(() => {
    initializeLanguage();
  }, []);

  return null; // This component doesn't render anything
}

