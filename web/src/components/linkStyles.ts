type LinkTone = 'primary' | 'muted';

const linkToneMap: Record<LinkTone, string> = {
  primary:
    'text-blue-300 hover:text-blue-100 underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200',
  muted:
    'text-blue-400 hover:text-blue-300 underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200',
};

export function textLinkStyles(tone: LinkTone = 'primary') {
  return linkToneMap[tone];
}

export function backLinkStyles() {
  return 'inline-flex items-center text-blue-400 hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200';
}

export function navLinkButtonStyles() {
  return 'inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200';
}
