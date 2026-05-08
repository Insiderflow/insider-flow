import type { ReactNode } from 'react';

type FilterBarProps = {
  children: ReactNode;
  className?: string;
  method?: 'get' | 'post';
  id?: string;
};

export default function FilterBar({ children, className = '', method = 'get', id }: FilterBarProps) {
  return (
    <form
      id={id}
      method={method}
      className={`rounded-xl border border-gray-700 bg-gray-800/70 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}
    >
      {children}
    </form>
  );
}
