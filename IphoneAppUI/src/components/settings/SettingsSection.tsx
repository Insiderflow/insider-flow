interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section>
      {title && (
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-2xl bg-[#1C1C1E] divide-y divide-white/[0.06]">
        {children}
      </div>
    </section>
  );
}
