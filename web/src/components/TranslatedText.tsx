'use client';

import { useTranslation } from '@/hooks/useTranslation';

interface TranslatedTextProps {
  translationKey: string;
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

