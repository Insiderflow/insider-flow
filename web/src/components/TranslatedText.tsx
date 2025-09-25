'use client';

import { useTranslation } from '@/hooks/useTranslation';

import { type Translations } from '@/lib/translations';

interface TranslatedTextProps {
  translationKey: keyof Translations;
  fallback?: string;
  className?: string;
}

export default function TranslatedText({ translationKey, fallback, className }: TranslatedTextProps) {
  const { t } = useTranslation();
  
  return (
    <span className={className}>
      {t(translationKey) || fallback}
    </span>
  );
}

