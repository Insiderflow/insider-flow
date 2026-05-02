import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentLanguage, setCurrentLanguage } from './language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => getCurrentLanguage());

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

