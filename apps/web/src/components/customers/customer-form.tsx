'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateCustomerInput } from '@/hooks/use-customers';
import type { Customer } from '@sse/shared-types';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  isLoading?: boolean;
}

export function CustomerForm({ initialData, onSubmit, isLoading }: CustomerFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateCustomerInput = {
      type: (formData.get('type') as string) || 'individual',
      first_name: (formData.get('first_name') as string).trim(),
      last_name: (formData.get('last_name') as string).trim(),
      phone: (formData.get('phone') as string).trim(),
      source: (formData.get('source') as string) || 'walk_in',
    };

    // Optional fields
    const email = (formData.get('email') as string)?.trim();
    if (email) data.email = email;
    const phoneSecondary = (formData.get('phone_secondary') as string)?.trim();
    if (phoneSecondary) data.phone_secondary = phoneSecondary;
    const companyName = (formData.get('company_name') as string)?.trim();
    if (companyName) data.company_name = companyName;
    const address = (formData.get('address') as string)?.trim();
    if (address) data.address = address;
    const city = (formData.get('city') as string)?.trim();
    if (city) data.city = city;
    const state = formData.get('state') as string;
    if (state) data.state = state;
    const zip = (formData.get('zip') as string)?.trim();
    if (zip) data.zip = zip;
    const policyNumber = (formData.get('policy_number') as string)?.trim();
    if (policyNumber) data.policy_number = policyNumber;
    const notes = (formData.get('notes') as string)?.trim();
    if (notes) data.notes = notes;

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!data.first_name) newErrors.first_name = 'First name is required';
    if (!data.last_name) newErrors.last_name = 'Last name is required';
    if (!data.phone || data.phone.length < 7) newErrors.phone = 'Valid phone number is required';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email address';
    }

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

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Customer Type</Label>
            <Select id="type" name="type" defaultValue={initialData?.type || 'individual'}>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select id="source" name="source" defaultValue={initialData?.source || 'walk_in'}>
              <option value="walk_in">Walk-in</option>
              <option value="insurance">Insurance</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={initialData?.first_name || ''}
              maxLength={100}
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={initialData?.last_name || ''}
              maxLength={100}
            />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={initialData?.company_name || ''}
            maxLength={255}
          />
        </div>
      </section>

      {/* Contact Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initialData?.phone || ''}
              maxLength={30}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_secondary">Secondary Phone</Label>
            <Input
              id="phone_secondary"
              name="phone_secondary"
              type="tel"
              defaultValue={initialData?.phone_secondary || ''}
              maxLength={30}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData?.email || ''}
            placeholder="customer@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Address</h2>
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={initialData?.address || ''}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={initialData?.city || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select id="state" name="state" defaultValue={initialData?.state || ''}>
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              name="zip"
              defaultValue={initialData?.zip || ''}
              maxLength={10}
              placeholder="65101"
            />
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Insurance</h2>
        <div className="space-y-2">
          <Label htmlFor="policy_number">Policy Number</Label>
          <Input
            id="policy_number"
            name="policy_number"
            defaultValue={initialData?.policy_number || ''}
            maxLength={50}
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
          placeholder="Additional notes about this customer..."
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Customer' : 'Create Customer'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
