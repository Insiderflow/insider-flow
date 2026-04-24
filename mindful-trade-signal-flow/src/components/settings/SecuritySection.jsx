import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import SettingsCard from './SettingsCard';
import SaveButton from './SaveButton';
import { useToast } from '@/components/ui/use-toast';
import { accountEndpoints } from '@/lib/api/endpoints';

function PasswordInput({ label, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className={`flex items-center bg-secondary/50 rounded-xl border ${error ? 'border-sell/60' : 'border-border/50'} h-11 px-3 gap-2`}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button onClick={() => setShow(v => !v)} className="text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1 text-[11px] text-sell">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

function strengthLabel(pw) {
  if (!pw) return null;
  if (pw.length < 6) return { label: 'Too short', color: 'bg-sell', width: 'w-1/4' };
  if (pw.length < 10) return { label: 'Fair', color: 'bg-warning-color', width: 'w-2/4' };
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Good', color: 'bg-buy/70', width: 'w-3/4' };
  return { label: 'Strong', color: 'bg-buy', width: 'w-full' };
}

export default function SecuritySection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState('idle');
  const { toast } = useToast();

  const strength = strengthLabel(next);

  const validate = () => {
    const e = {};
    if (!current) e.current = 'Required';
    if (next.length < 8) e.next = 'Must be at least 8 characters';
    if (next !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveState('saving');
    try {
      await accountEndpoints.changePassword({
        current_password: current,
        new_password: next,
      });
      setSaveState('saved');
      toast({ title: 'Password updated', description: 'Your new password is active.' });
      setCurrent(''); setNext(''); setConfirm('');
      setErrors({});
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      toast({ title: 'Failed to update password', description: 'Check your current password and try again.', variant: 'destructive' });
      setTimeout(() => setSaveState('idle'), 2000);
    }
  };

  return (
    <SettingsCard icon={Shield} title="Security" iconBg="bg-buy/10" iconColor="text-buy">
      <PasswordInput label="Current password" value={current} onChange={setCurrent} error={errors.current} />
      <div className="space-y-1.5">
        <PasswordInput label="New password" value={next} onChange={setNext} error={errors.next} />
        {strength && (
          <div className="space-y-1">
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
            </div>
            <p className={`text-[10px] font-medium ${
              strength.label === 'Strong' ? 'text-buy' :
              strength.label === 'Good' ? 'text-buy/70' :
              strength.label === 'Fair' ? 'text-warning-color' : 'text-sell'
            }`}>{strength.label}</p>
          </div>
        )}
      </div>
      <PasswordInput label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} />
      <SaveButton state={saveState} onClick={handleSave} label="Update password" />
    </SettingsCard>
  );
}