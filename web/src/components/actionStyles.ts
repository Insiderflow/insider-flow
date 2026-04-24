type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const baseClass =
  'inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

const variantMap: Record<ActionVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
  secondary: 'bg-white text-[#007BFF] border border-[#007BFF] hover:bg-[#007BFF] hover:text-white',
  danger: 'bg-orange-600 text-white border border-orange-600 hover:bg-orange-700',
  ghost: 'bg-gray-700 text-gray-100 border border-gray-600 hover:bg-gray-600',
};

export function actionStyles(variant: ActionVariant = 'secondary') {
  return `${baseClass} ${variantMap[variant]}`;
}
