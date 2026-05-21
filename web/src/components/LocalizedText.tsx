import type { ReactNode } from 'react';

type LocalizedTextProps = {
  hant: ReactNode;
  hans?: ReactNode;
  ko?: ReactNode;
  className?: string;
};

/** Renders zh-Hant / zh-Hans / ko spans toggled by body.language-* class. */
export default function LocalizedText({ hant, hans, ko, className }: LocalizedTextProps) {
  const hansContent = hans ?? hant;
  const koContent = ko ?? hansContent;
  const cls = className ? ` ${className}` : '';

  return (
    <>
      <span className={`zh-Hant${cls}`}>{hant}</span>
      <span className={`zh-Hans hidden${cls}`}>{hansContent}</span>
      <span className={`ko hidden${cls}`}>{koContent}</span>
    </>
  );
}
