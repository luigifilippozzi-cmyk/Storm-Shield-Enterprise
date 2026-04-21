'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

interface Props {
  estimateId: string;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function Step5ServiceOrder({ estimateId, onComplete, onBack, onSkip, isLoading }: Props) {
  const { getToken, orgId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    setError('');

    try {
      const token = (await getToken()) || undefined;
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Clerk-Org-Id'] = orgId;

      await api('/service-orders', {
        method: 'POST',
        body: JSON.stringify({ estimate_id: estimateId, status: 'open' }),
        token,
        headers,
      });

      setCreated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create service order. You can create one manually from the estimate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Open a service order</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Convert your estimate into a service order to start tracking work.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm">
          We'll open a service order from the estimate you just created. This is how repair jobs are
          tracked in Storm Shield — from estimate approval to completed repair.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {created && (
        <div className="rounded-lg bg-primary/10 p-4">
          <p className="font-medium text-primary">✓ Service order created!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You're all set. Click "Finish setup" to go to your cockpit.
          </p>
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
        {created ? (
          <Button onClick={onComplete} disabled={isLoading}>
            Finish setup ✓
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={saving || isLoading}>
            {saving ? 'Creating…' : 'Create service order →'}
          </Button>
        )}
      </div>
    </div>
  );
}
