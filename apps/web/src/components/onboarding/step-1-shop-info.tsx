'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShopInfoData {
  name: string;
  address?: string;
  phone?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
}

interface Props {
  onNext: (data: ShopInfoData) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

const PLANS = [
  { id: 'free', label: 'Free', description: 'Up to 50 customers, 25 estimates' },
  { id: 'starter', label: 'Starter', description: '500 customers + insurance & contractors' },
  { id: 'pro', label: 'Pro', description: 'Unlimited + accounting & FAM' },
  { id: 'enterprise', label: 'Enterprise', description: 'All modules + rental & API access' },
] as const;

export function Step1ShopInfo({ onNext, onSkip, isLoading }: Props) {
  const [form, setForm] = useState<ShopInfoData>({ name: '', plan: 'free' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Shop name is required');
      return;
    }
    setError('');
    onNext(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tell us about your shop</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Basic info to personalize your Storm Shield experience.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Shop name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Acme Body Shop"
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="123 Main St, Springfield, MO 65801"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="(417) 555-0100"
          />
        </div>

        <div className="space-y-2">
          <Label>Plan</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, plan: plan.id }))}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  form.plan === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">{plan.label}</p>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Skip wizard
        </button>
        <Button type="submit" disabled={isLoading}>
          Next →
        </Button>
      </div>
    </form>
  );
}
