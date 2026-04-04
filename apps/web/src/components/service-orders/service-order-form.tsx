'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateServiceOrderInput } from '@/hooks/use-service-orders';
import type { ServiceOrder } from '@sse/shared-types';

interface ServiceOrderFormProps {
  initialData?: ServiceOrder;
  onSubmit: (data: CreateServiceOrderInput) => Promise<void>;
  isLoading?: boolean;
}

export function ServiceOrderForm({ initialData, onSubmit, isLoading }: ServiceOrderFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data: CreateServiceOrderInput = {
      estimate_id: (fd.get('estimate_id') as string).trim(),
      customer_id: (fd.get('customer_id') as string).trim(),
      vehicle_id: (fd.get('vehicle_id') as string).trim(),
    };

    const opt = (k: string) => { const v = (fd.get(k) as string)?.trim(); return v || undefined; };
    data.assigned_to = opt('assigned_to');
    data.estimated_completion = opt('estimated_completion');
    data.notes = opt('notes');

    const newErrors: Record<string, string> = {};
    if (!data.estimate_id) newErrors.estimate_id = 'Estimate ID is required';
    if (!data.customer_id) newErrors.customer_id = 'Customer ID is required';
    if (!data.vehicle_id) newErrors.vehicle_id = 'Vehicle ID is required';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try { await onSubmit(data); } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.form && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{errors.form}</div>}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">References</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="estimate_id">Estimate ID *</Label>
            <Input id="estimate_id" name="estimate_id" defaultValue={initialData?.estimate_id || ''} placeholder="Estimate UUID" />
            {errors.estimate_id && <p className="text-xs text-destructive">{errors.estimate_id}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer ID *</Label>
            <Input id="customer_id" name="customer_id" defaultValue={initialData?.customer_id || ''} placeholder="Customer UUID" />
            {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vehicle ID *</Label>
            <Input id="vehicle_id" name="vehicle_id" defaultValue={initialData?.vehicle_id || ''} placeholder="Vehicle UUID" />
            {errors.vehicle_id && <p className="text-xs text-destructive">{errors.vehicle_id}</p>}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Assignment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To (User ID)</Label>
            <Input id="assigned_to" name="assigned_to" defaultValue={initialData?.assigned_to || ''} placeholder="Technician UUID" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_completion">Estimated Completion</Label>
            <Input id="estimated_completion" name="estimated_completion" type="date" defaultValue={initialData?.estimated_completion?.slice(0, 10) || ''} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Textarea id="notes" name="notes" defaultValue={initialData?.notes || ''} rows={3} />
      </section>

      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Service Order' : 'Create Service Order'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
