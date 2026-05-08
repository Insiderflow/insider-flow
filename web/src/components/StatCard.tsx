import { statSurfaceStyles } from '@/components/surfaceStyles';

type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

export default function StatCard({ label, value, className = '' }: StatCardProps) {
  return (
    <div className={`${statSurfaceStyles()} ${className}`}>
      <div className="text-xs text-white/80">{label}</div>
      <div className="text-lg sm:text-xl font-semibold text-white mt-1">{value}</div>
    </div>
  );
}
