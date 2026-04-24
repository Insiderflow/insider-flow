type ControlSize = 'sm' | 'md';

const baseControl =
  'border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200';

const sizeMap: Record<ControlSize, string> = {
  sm: 'p-1 text-xs sm:text-sm',
  md: 'px-3 py-2 text-sm',
};

export function fieldControlStyles(size: ControlSize = 'sm') {
  return `${baseControl} ${sizeMap[size]}`;
}

export function fieldLabelStyles() {
  return 'text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white';
}
