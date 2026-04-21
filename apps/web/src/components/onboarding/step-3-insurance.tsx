'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInsuranceSeedList } from '@/hooks/use-wizard';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

interface Props {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function Step3Insurance({ onNext, onBack, onSkip, isLoading }: Props) {
  const { data: seedList, isLoading: loadingSeeds } = useInsuranceSeedList();
  const { getToken, orgId } = useAuth();

  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState('');

  const handleSave = async () => {
    const name = selected === '__custom__' ? customName.trim() : selected;
    if (!name) return;

    setSaving(true);
    try {
      const token = (await getToken()) || undefined;
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Clerk-Org-Id'] = orgId;

      const seed = seedList?.find((s) => s.name === name);
      await api('/insurance', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code: seed?.code ?? name.toUpperCase().replace(/\s+/g, '_').slice(0, 20),
          phone: selected === '__custom__' ? customPhone : seed?.phone,
          is_drp: false,
        }),
        token,
        headers,
      });
      setSavedName(name);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Add an insurance company</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Which insurer do you work with most? You can add more anytime.
        </p>
      </div>

      {loadingSeeds ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {seedList?.map((ins) => (
              <button
                key={ins.code}
                type="button"
                onClick={() => setSelected(ins.name)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  selected === ins.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">{ins.name}</p>
                <p className="text-xs text-muted-foreground">{ins.phone}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected('__custom__')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected === '__custom__'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">Other…</p>
              <p className="text-xs text-muted-foreground">Enter manually</p>
            </button>
          </div>

          {selected === '__custom__' && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="ins-name">Company name</Label>
                <Input
                  id="ins-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Springfield Mutual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ins-phone">Phone</Label>
                <Input
                  id="ins-phone"
                  type="tel"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="(417) 555-0200"
                />
              </div>
            </div>
          )}

          {selected && !savedName && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={saving || (selected === '__custom__' && !customName.trim())}
              className="w-full"
            >
              {saving ? 'Saving…' : 'Save insurance company'}
            </Button>
          )}

          {savedName && (
            <p className="rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary">
              ✓ {savedName} saved successfully
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip wizard
          </button>
        </div>
        <Button onClick={onNext} disabled={isLoading}>
          Next →
        </Button>
      </div>
    </div>
  );
}
