type BadgeTone =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'republican'
  | 'democrat';

type BadgeSize = 'xs' | 'sm' | 'md';

const baseBadge = 'inline-flex items-center font-medium';

const sizeMap: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-xs rounded',
  sm: 'px-2 py-1 text-xs rounded',
  md: 'px-3 py-1 text-sm rounded-full',
};

const toneMap: Record<BadgeTone, string> = {
  success: 'bg-green-600 text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-yellow-600 text-white',
  info: 'bg-blue-600 text-white',
  neutral: 'bg-gray-600 text-gray-100',
  republican: 'bg-red-500 text-white',
  democrat: 'bg-blue-500 text-white',
};

export function badgeStyles(tone: BadgeTone = 'neutral', size: BadgeSize = 'md') {
  return `${baseBadge} ${sizeMap[size]} ${toneMap[tone]}`;
}
