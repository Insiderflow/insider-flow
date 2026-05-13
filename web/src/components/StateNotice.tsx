import type { ReactNode } from 'react';

type StateNoticeTone = 'info' | 'warning' | 'error';

const toneClasses: Record<StateNoticeTone, string> = {
  info: 'bg-blue-900/30 border-blue-600 text-blue-100',
  warning: 'bg-yellow-900/30 border-yellow-600 text-yellow-100',
  error: 'bg-red-900/30 border-red-600 text-red-100',
};

export default function StateNotice({
  title,
  description,
  tone = 'info',
  actions,
}: {
  title: ReactNode;
  description: ReactNode;
  tone?: StateNoticeTone;
  actions?: ReactNode;
}) {
  return (
    <div className={`border rounded-lg p-4 ${toneClasses[tone]}`}>
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-sm opacity-90">{description}</p>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </div>
  );
}
