type PanelPadding = 'sm' | 'md' | 'lg';

const panelPaddingMap: Record<PanelPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function panelSurfaceStyles(padding: PanelPadding = 'md') {
  return `bg-gray-800 border border-gray-600 rounded-lg ${panelPaddingMap[padding]}`;
}

export function statSurfaceStyles() {
  return 'border border-gray-600 bg-gray-800 rounded shadow-md p-2 sm:p-4';
}
