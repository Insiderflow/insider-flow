import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ children, className, action }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <h2 className="section-header mb-0">{children}</h2>
      {action}
    </div>
  );
}
