import React, { useState } from 'react';
import { LogOut, Smartphone, AlertTriangle, X } from 'lucide-react';
import SettingsCard from './SettingsCard';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { authEndpoints } from '@/lib/api/endpoints';

function ConfirmSheet({ title, description, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-card rounded-3xl border border-border/50 p-5 animate-slide-up space-y-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sell/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-sell" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
          <button onClick={onCancel} className="ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border/60 text-sm font-medium text-foreground bg-secondary/50 hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionSection() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(null); // 'logout' | 'logout-all'
  const [loading, setLoading] = useState(false);

  const ACTION_CONFIG = {
    'logout': {
      title: 'Sign out of this device',
      description: 'You will be redirected to the login screen. Your data and watchlist are safely stored.',
      confirmLabel: 'Sign out',
      confirmClass: 'bg-sell hover:bg-sell/90',
      onConfirm: async () => {
        setLoading(true);
        await logout(true);
      },
    },
    'logout-all': {
      title: 'Sign out of all devices',
      description: 'All active sessions across every device will be terminated. You will need to log in again everywhere.',
      confirmLabel: 'Sign out everywhere',
      confirmClass: 'bg-sell hover:bg-sell/90',
      onConfirm: async () => {
        setLoading(true);
        try {
          await authEndpoints.logoutAll();
          toast({ title: 'Signed out from all devices' });
          await logout(true);
        } catch {
          toast({ title: 'Failed to sign out everywhere', variant: 'destructive' });
          setLoading(false);
          setConfirm(null);
        }
      },
    },
  };

  const cfg = confirm ? ACTION_CONFIG[confirm] : null;

  return (
    <>
      <SettingsCard icon={Smartphone} title="Sessions" iconBg="bg-sell/10" iconColor="text-sell">
        <div className="space-y-2">
          <button
            onClick={() => setConfirm('logout')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
          >
            <LogOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-[11px] text-muted-foreground">This device only</p>
            </div>
          </button>
          <button
            onClick={() => setConfirm('logout-all')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sell/10 transition-colors text-left border border-sell/20"
          >
            <Smartphone className="h-4 w-4 text-sell flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-sell">Sign out all devices</p>
              <p className="text-[11px] text-muted-foreground">Terminate all active sessions</p>
            </div>
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5 leading-relaxed">
          🔒 Sessions are encrypted and expire automatically. Signing out removes your local access token.
        </p>
      </SettingsCard>

      {confirm && cfg && (
        <ConfirmSheet
          {...cfg}
          loading={loading}
          onCancel={() => { if (!loading) setConfirm(null); }}
        />
      )}
    </>
  );
}