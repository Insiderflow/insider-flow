export function tableWrapperStyles(variant: 'default' | 'wide' = 'default') {
  if (variant === 'wide') {
    return 'overflow-x-auto xl:overflow-x-visible rounded border border-gray-600 bg-gray-800 shadow-md';
  }
  return 'overflow-x-auto rounded border border-gray-600 bg-gray-800 shadow-md';
}

export function tableCellCompactStyles(extra?: string) {
  return `px-2 py-2.5 lg:px-3 lg:py-3 whitespace-nowrap text-sm ${extra ?? 'text-gray-300'}`;
}

export function tableHeaderStyles() {
  return 'sticky top-0 bg-gray-700 border-b border-gray-600 z-10';
}

export function tableHeaderRowStyles() {
  return 'text-left';
}

export function tableHeaderCellStyles(padding: 'sm' | 'md' = 'sm') {
  return `${padding === 'md' ? 'p-3' : 'p-2'} text-white`;
}

export function tableSortButtonStyles() {
  return 'flex items-center gap-1 hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200';
}

export function tableBodyStyles() {
  return 'divide-y divide-gray-600';
}

export function tableRowStyles() {
  return 'hover:bg-gray-700 focus-within:bg-gray-700';
}

export function tableCellStyles(padding: 'sm' | 'md' = 'sm') {
  return `${padding === 'md' ? 'p-3' : 'p-2'} text-white`;
}

export function mobileTableCardStyles() {
  return 'border border-gray-600 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200';
}

export function mobileTableCardHeaderStyles() {
  return 'p-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200';
}

export function mobileMetaLabelStyles() {
  return 'text-xs text-gray-400 font-medium uppercase tracking-wide';
}
