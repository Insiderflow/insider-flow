import React from 'react';
import { User } from 'lucide-react';
import SettingsCard from './SettingsCard';

export default function ProfileSection({ user }) {
  if (!user) return null;

  const initials = (user.full_name || user.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SettingsCard icon={User} title="Profile" iconBg="bg-secondary" iconColor="text-foreground" defaultOpen>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{user.full_name || '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-buy/10 text-buy text-[10px] font-semibold capitalize">
            {user.role || 'user'}
          </span>
        </div>
      </div>
      <div className="rounded-xl bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Member since</span>
          <span className="text-foreground font-medium">
            {user.created_date
              ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Account ID</span>
          <span className="font-mono text-[10px] text-foreground">{String(user.id || '').slice(-8)}</span>
        </div>
      </div>
    </SettingsCard>
  );
}