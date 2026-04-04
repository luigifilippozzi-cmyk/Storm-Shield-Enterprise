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
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
];

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: CreateVehicleInput) => Promise<void>;
  isLoading?: boolean;
}

export function VehicleForm({ initialData, onSubmit, isLoading }: VehicleFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateVehicleInput = {
      customer_id: (formData.get('customer_id') as string).trim(),
      year: parseInt(formData.get('year') as string, 10),
      make: (formData.get('make') as string).trim(),
      model: (formData.get('model') as string).trim(),
    };

    // Optional fields
    const vin = (formData.get('vin') as string)?.trim();
    if (vin) data.vin = vin;
    const trim = (formData.get('trim') as string)?.trim();
    if (trim) data.trim = trim;
    const color = (formData.get('color') as string)?.trim();
    if (color) data.color = color;
    const mileage = formData.get('mileage') as string;
    if (mileage && mileage.trim()) data.mileage = parseInt(mileage, 10);
    const condition = formData.get('condition') as string;
    if (condition) data.condition = condition;
    const licensePlate = (formData.get('license_plate') as string)?.trim();
    if (licensePlate) data.license_plate = licensePlate;
    const licenseState = formData.get('license_state') as string;
    if (licenseState) data.license_state = licenseState;
    const claimNumber = (formData.get('claim_number') as string)?.trim();
    if (claimNumber) data.claim_number = claimNumber;
    const notes = (formData.get('notes') as string)?.trim();
    if (notes) data.notes = notes;

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!data.customer_id) newErrors.customer_id = 'Customer is required';
    if (!data.year || data.year < 1900 || data.year > 2027) {
      newErrors.year = 'Valid year (1900-2027) is required';
    }
    if (!data.make) newErrors.make = 'Make is required';
    if (!data.model) newErrors.model = 'Model is required';
    if (data.vin && data.vin.length !== 17) {
      newErrors.vin = 'VIN must be exactly 17 characters';
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

      {/* Vehicle Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vehicle Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              name="year"
              type="number"
              min="1900"
              max="2027"
              defaultValue={initialData?.year || ''}
              placeholder="2023"
            />
            {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              name="make"
              defaultValue={initialData?.make || ''}
              maxLength={100}
              placeholder="Honda"
            />
            {errors.make && <p className="text-xs text-destructive">{errors.make}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              name="model"
              defaultValue={initialData?.model || ''}
              maxLength={100}
              placeholder="Civic"
            />
            {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trim">Trim</Label>
            <Input
              id="trim"
              name="trim"
              defaultValue={initialData?.trim || ''}
              maxLength={100}
              placeholder="EX-L"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              name="color"
              defaultValue={initialData?.color || ''}
              maxLength={100}
              placeholder="Blue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              name="vin"
              defaultValue={initialData?.vin || ''}
              maxLength={17}
              placeholder="JHMCJ5C46LM123456"
            />
            {errors.vin && <p className="text-xs text-destructive">{errors.vin}</p>}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage</Label>
            <Input
              id="mileage"
              name="mileage"
              type="number"
              min="0"
              defaultValue={initialData?.mileage || ''}
              placeholder="50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select id="condition" name="condition" defaultValue={initialData?.condition || ''}>
              <option value="">Select condition</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="license_plate">License Plate</Label>
            <Input
              id="license_plate"
              name="license_plate"
              defaultValue={initialData?.license_plate || ''}
              maxLength={20}
              placeholder="ABC1234"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_state">License State</Label>
            <Select
              id="license_state"
              name="license_state"
              defaultValue={initialData?.license_state || ''}
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Insurance</h2>
        <div className="space-y-2">
          <Label htmlFor="claim_number">Claim Number</Label>
          <Input
            id="claim_number"
            name="claim_number"
            defaultValue={initialData?.claim_number || ''}
            maxLength={100}
            placeholder="CLM-2023-001"
          />
        </div>
      </section>

      {/* Customer */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Customer</h2>
        <div className="space-y-2">
          <Label htmlFor="customer_id">Customer ID *</Label>
          <Input
            id="customer_id"
            name="customer_id"
            defaultValue={initialData?.customer_id || ''}
            placeholder="UUID"
          />
          {errors.customer_id && (
            <p className="text-xs text-destructive">{errors.customer_id}</p>
          )}
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
          placeholder="Additional notes about this vehicle..."
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Vehicle' : 'Create Vehicle'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
