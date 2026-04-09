'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface SupplementFormData {
  reason: string;
  amount: number;
}

interface SupplementFormProps {
  onSubmit: (data: SupplementFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SupplementForm({ onSubmit, onCancel, isLoading }: SupplementFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const reason = (fd.get('reason') as string || '').trim();
    const amount = parseFloat(fd.get('amount') as string || '0');

    const newErrors: Record<string, string> = {};
    if (!reason) newErrors.reason = 'Reason is required';
    if (!amount || amount <= 0) newErrors.amount = 'Amount must be greater than 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      await onSubmit({ reason, amount });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.form}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="reason">Reason *</Label>
          <Textarea
            id="reason"
            name="reason"
            placeholder="Describe the reason for this supplement..."
            required
            rows={3}
          />
          {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Add Supplement'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
