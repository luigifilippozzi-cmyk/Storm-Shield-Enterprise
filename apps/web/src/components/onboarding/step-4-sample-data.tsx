'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

const SAMPLE_CUSTOMER = {
  first_name: 'Demo',
  last_name: 'Customer',
  phone: '4175550001',
  email: 'demo@example.com',
  type: 'individual',
};

const SAMPLE_VEHICLE = {
  year: 2020,
  make: 'Toyota',
  model: 'Camry',
  vin: '',
  color: 'Silver',
};

interface Props {
  onNext: (estimateId: string) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function Step4SampleData({ onNext, onBack, onSkip, isLoading }: Props) {
  const { getToken, orgId } = useAuth();
  const [useSample, setUseSample] = useState(true);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setSaving(true);
    setError('');

    try {
      const token = (await getToken()) || undefined;
      const headers: Record<string, string> = {};
      if (orgId) headers['X-Clerk-Org-Id'] = orgId;

      const customerPayload = useSample
        ? { ...SAMPLE_CUSTOMER, is_sample: true }
        : {
            first_name: customerName.split(' ')[0] || customerName,
            last_name: customerName.split(' ').slice(1).join(' ') || 'Customer',
            phone: customerPhone || '0000000000',
            type: 'individual',
            is_sample: false,
          };

      const customer = await api<{ id: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify(customerPayload),
        token,
        headers,
      });

      const vehiclePayload = useSample
        ? { ...SAMPLE_VEHICLE, customer_id: customer.id, is_sample: true }
        : { year: 2020, make: 'Toyota', model: 'Camry', customer_id: customer.id, is_sample: false };

      const vehicle = await api<{ id: string }>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehiclePayload),
        token,
        headers,
      });

      const estimate = await api<{ id: string }>('/estimates', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          description: 'Sample estimate — front bumper PDR',
          is_sample: useSample,
          lines: [{ description: 'Front bumper PDR', quantity: 1, unit_price: '250.00' }],
        }),
        token,
        headers,
      });

      onNext(estimate.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create sample data. You can skip and add data manually.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Create your first estimate</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll create a sample customer, vehicle, and estimate so you can explore the app.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            id="use-sample"
            type="checkbox"
            checked={useSample}
            onChange={(e) => setUseSample(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="use-sample" className="cursor-pointer">
            Use sample data (Demo Customer · Toyota Camry 2020 · $250 estimate)
          </Label>
        </div>

        {!useSample && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Customer name</Label>
              <Input
                id="cust-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(417) 555-0100"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
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
        <Button onClick={handleCreate} disabled={saving || isLoading}>
          {saving ? 'Creating…' : 'Create & continue →'}
        </Button>
      </div>
    </div>
  );
}
