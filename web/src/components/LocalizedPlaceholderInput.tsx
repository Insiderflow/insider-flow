'use client';

import { useTranslation } from '@/hooks/useTranslation';
import type { Translations } from '@/lib/translations';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  placeholderKey: keyof Translations;
};

export default function LocalizedPlaceholderInput({
  placeholderKey,
  ...props
}: Props) {
  const { t } = useTranslation();
  return <input {...props} placeholder={t(placeholderKey)} />;
}
