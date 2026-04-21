'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InviteEntry {
  email: string;
  role: string;
}

interface Props {
  onNext: (invites: InviteEntry[]) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

const ROLES = ['estimator', 'technician', 'accountant', 'manager', 'viewer'];

export function Step2InviteTeam({ onNext, onBack, onSkip, isLoading }: Props) {
  const [invites, setInvites] = useState<InviteEntry[]>([{ email: '', role: 'technician' }]);

  const addRow = () => setInvites((prev) => [...prev, { email: '', role: 'technician' }]);

  const updateRow = (idx: number, field: keyof InviteEntry, value: string) => {
    setInvites((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const removeRow = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    const valid = invites.filter((inv) => inv.email.trim());
    onNext(valid);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Invite your team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add team members by email. They'll receive an invitation to join your shop.
          <span className="ml-1 text-muted-foreground/70">(Optional — you can do this later in Settings)</span>
        </p>
      </div>

      <div className="space-y-3">
        {invites.map((inv, idx) => (
          <div key={idx} className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="sr-only">Email</Label>
              <Input
                type="email"
                placeholder="colleague@shop.com"
                value={inv.email}
                onChange={(e) => updateRow(idx, 'email', e.target.value)}
              />
            </div>
            <div className="w-36 space-y-1">
              <Label className="sr-only">Role</Label>
              <select
                value={inv.role}
                onChange={(e) => updateRow(idx, 'role', e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="mt-1 text-sm text-muted-foreground hover:text-destructive"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          + Add another
        </button>
      </div>

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
        <Button onClick={handleNext} disabled={isLoading}>
          Next →
        </Button>
      </div>
    </div>
  );
}
