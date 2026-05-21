'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentLanguage, setLanguage, type Language } from '@/lib/languageUtils';
import LocalizedText from '@/components/LocalizedText';

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'zh-Hant', label: '繁體' },
  { code: 'zh-Hans', label: '简体' },
  { code: 'ko', label: '한국어' },
];

export default function LanguageToggle() {
  const [language, setLanguageState] = useState<Language>('zh-Hant');
  const router = useRouter();

  useEffect(() => {
    const currentLanguage = getCurrentLanguage();
    setLanguageState(currentLanguage);
    setLanguage(currentLanguage);
  }, []);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setLanguage(newLanguage);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-300 shrink-0">
        <LocalizedText hant="介面語言" hans="界面语言" ko="언어" />
      </span>
      <div className="flex bg-gray-700 rounded-lg p-1">
        {OPTIONS.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLanguageChange(code)}
            className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
              language === code
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
