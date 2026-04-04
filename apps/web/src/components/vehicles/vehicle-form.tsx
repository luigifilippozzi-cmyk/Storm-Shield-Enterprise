'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateVehicleInput } from '@/hooks/use-vehicles';
import type { Vehicle } from '@sse/shared-types';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const currentYear = new Date().getFullYear();

interface VehicleFormProps {
  initialData?: Vehicle;
  customerId?: string;
  onSubmit: (data: CreateVehicleInput) => Promise<void>;
  isLoading?: boolean;
}

export function VehicleForm({ initialData, customerId, onSubmit, isLoading }: VehicleFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data: CreateVehicleInput = {
      customer_id: (fd.get('customer_id') as string) || customerId || '',
      year: parseInt(fd.get('year') as string, 10),
      make: (fd.get('make') as string).trim(),
      model: (fd.get('model') as string).trim(),
    };

    const optional = (key: string) => {
      const val = (fd.get(key) as string)?.trim();
      return val || undefined;
    };

    data.trim = optional('trim');
    data.color = optional('color');
    data.vin = optional('vin');
    const mileage = optional('mileage');
    if (mileage) data.mileage = parseInt(mileage, 10);
    data.condition = optional('condition');
    data.license_plate = optional('license_plate');
    data.license_state = optional('license_state');
    data.claim_number = optional('claim_number');
    data.notes = optional('notes');

    const newErrors: Record<string, string> = {};
    if (!data.customer_id) newErrors.customer_id = 'Customer ID is required';
    if (!data.year || data.year < 1900 || data.year > currentYear + 2) newErrors.year = 'Valid year is required';
    if (!data.make) newErrors.make = 'Make is required';
    if (!data.model) newErrors.model = 'Model is required';
    if (data.vin && data.vin.length !== 17) newErrors.vin = 'VIN must be 17 characters';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try {
      await onSubmit(data);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.form && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{errors.form}</div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vehicle Information</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input id="year" name="year" type="number" min={1900} max={currentYear + 2} defaultValue={initialData?.year || ''} />
            {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input id="make" name="make" defaultValue={initialData?.make || ''} maxLength={100} placeholder="e.g. Toyota" />
            {errors.make && <p className="text-xs text-destructive">{errors.make}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" name="model" defaultValue={initialData?.model || ''} maxLength={100} placeholder="e.g. Camry" />
            {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="trim">Trim</Label>
            <Input id="trim" name="trim" defaultValue={initialData?.trim || ''} placeholder="e.g. SE, XLE" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" defaultValue={initialData?.color || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select id="condition" name="condition" defaultValue={initialData?.condition || ''}>
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input id="vin" name="vin" defaultValue={initialData?.vin || ''} maxLength={17} placeholder="17-character VIN" />
            {errors.vin && <p className="text-xs text-destructive">{errors.vin}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage</Label>
            <Input id="mileage" name="mileage" type="number" min={0} defaultValue={initialData?.mileage || ''} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Registration</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="license_plate">License Plate</Label>
            <Input id="license_plate" name="license_plate" defaultValue={initialData?.license_plate || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_state">License State</Label>
            <Select id="license_state" name="license_state" defaultValue={initialData?.license_state || ''}>
              <option value="">Select state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Insurance Claim</h2>
        <div className="space-y-2">
          <Label htmlFor="claim_number">Claim Number</Label>
          <Input id="claim_number" name="claim_number" defaultValue={initialData?.claim_number || ''} />
        </div>
      </section>

      {!customerId && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Owner</h2>
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer ID *</Label>
            <Input id="customer_id" name="customer_id" defaultValue={initialData?.customer_id || ''} placeholder="UUID of the customer" />
            {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
          </div>
        </section>
      )}
      {customerId && <input type="hidden" name="customer_id" value={customerId} />}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Textarea id="notes" name="notes" defaultValue={initialData?.notes || ''} rows={3} placeholder="Additional notes..." />
      </section>

      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Vehicle' : 'Create Vehicle'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
