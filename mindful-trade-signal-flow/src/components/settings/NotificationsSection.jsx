import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import SettingsCard from './SettingsCard';
import SaveButton from './SaveButton';
import { useToast } from '@/components/ui/use-toast';
import { accountEndpoints } from '@/lib/api/endpoints';

const DEFAULT_PREFS = {
  newTrades: true,
  watchlistUpdates: true,
  weeklyDigest: false,
};

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-secondary'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

const PREF_ROWS = [
  { key: 'newTrades', label: 'New trades', desc: 'New STOCK Act and insider filings' },
  { key: 'watchlistUpdates',  label: 'Watchlist activity', desc: 'Trades from tracked items' },
  { key: 'weeklyDigest',     label: 'Weekly digest', desc: 'Summary email every Monday' },
];

export default function NotificationsSection() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saveState, setSaveState] = useState('idle');
  const { toast } = useToast();

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    accountEndpoints.getNotificationSettings()
      .then((res) => {
        const settings = res.settings || res;
        setPrefs((prev) => ({ ...prev, ...settings }));
      })
      .catch(() => {
        // fallback to defaults
      });
  }, []);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await accountEndpoints.updateNotificationSettings(prefs);
      setSaveState('saved');
      toast({ title: 'Notification preferences saved' });
    } catch {
      setSaveState('error');
      toast({ title: 'Failed to save preferences', variant: 'destructive' });
    } finally {
      setTimeout(() => setSaveState('idle'), 2000);
    }
  };

  return (
    <SettingsCard icon={Bell} title="Notifications" iconBg="bg-warning/10" iconColor="text-warning-color">
      <div className="space-y-0 divide-y divide-border/30">
        {PREF_ROWS.map(row => (
          <div key={row.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 pr-4">
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-[11px] text-muted-foreground">{row.desc}</p>
            </div>
            <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} />
          </div>
        ))}
      </div>
      <SaveButton state={saveState} onClick={handleSave} label="Save preferences" />
    </SettingsCard>
  );
}