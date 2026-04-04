'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateInsuranceCompanyInput } from '@/hooks/use-insurance';
import type { InsuranceCompany } from '@sse/shared-types';

interface InsuranceFormProps {
  initialData?: InsuranceCompany;
  onSubmit: (data: CreateInsuranceCompanyInput) => Promise<void>;
  isLoading?: boolean;
}

export function InsuranceForm({ initialData, onSubmit, isLoading }: InsuranceFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateInsuranceCompanyInput = {
      name: (formData.get('name') as string).trim(),
    };

    // Optional fields
    const code = (formData.get('code') as string)?.trim();
    if (code) data.code = code;
    const isDrp = formData.get('is_drp') === 'on';
    data.is_drp = isDrp;
    const paymentTermsDays = formData.get('payment_terms_days') as string;
    if (paymentTermsDays && paymentTermsDays.trim()) {
      data.payment_terms_days = parseInt(paymentTermsDays, 10);
    }
    const phone = (formData.get('phone') as string)?.trim();
    if (phone) data.phone = phone;
    const email = (formData.get('email') as string)?.trim();
    if (email) data.email = email;
    const address = (formData.get('address') as string)?.trim();
    if (address) data.address = address;
    const notes = (formData.get('notes') as string)?.trim();
    if (notes) data.notes = notes;

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!data.name) newErrors.name = 'Company name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {errors.form}
        </div>
      )}

      {/* Company Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Company Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name || ''}
              maxLength={255}
              placeholder="State Farm"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              defaultValue={initialData?.code || ''}
              maxLength={50}
              placeholder="SF-001"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment_terms_days">Payment Terms (Days)</Label>
            <Input
              id="payment_terms_days"
              name="payment_terms_days"
              type="number"
              min="0"
              defaultValue={initialData?.payment_terms_days || '30'}
              placeholder="30"
            />
          </div>
          <div className="space-y-2 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_drp"
                defaultChecked={initialData?.is_drp || false}
                className="h-4 w-4 rounded border border-input"
              />
              <span className="text-sm font-medium">Direct Repair Program (DRP)</span>
            </label>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initialData?.phone || ''}
              maxLength={20}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData?.email || ''}
              maxLength={255}
              placeholder="contact@statefarm.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={initialData?.address || ''}
            maxLength={500}
            placeholder="123 Insurance Way, Kansas City, MO 64105"
          />
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialData?.notes || ''}
          rows={4}
          placeholder="Additional notes about this insurance company..."
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Company' : 'Create Company'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
