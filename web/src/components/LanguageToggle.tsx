'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentLanguage, setLanguage, type Language } from '@/lib/languageUtils';

export default function LanguageToggle() {
  const [language, setLanguageState] = useState<Language>('zh-Hant');
  const router = useRouter();
  const _pathname = usePathname();

  useEffect(() => {
    const currentLanguage = getCurrentLanguage();
    setLanguageState(currentLanguage);
    setLanguage(currentLanguage);
  }, []);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setLanguage(newLanguage);
    
    // Force a page refresh to update all text
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-300">語言:</span>
      <div className="flex bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => handleLanguageChange('zh-Hant')}
          className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
            language === 'zh-Hant'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          繁體
        </button>
        <button
          onClick={() => handleLanguageChange('zh-Hans')}
          className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
            language === 'zh-Hans'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          简体
        </button>
      </div>
    </div>
  );
}
