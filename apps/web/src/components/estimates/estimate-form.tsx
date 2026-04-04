'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateEstimateInput, EstimateLineInput } from '@/hooks/use-estimates';
import type { Estimate } from '@sse/shared-types';

const LINE_TYPES = [
  { value: 'labor', label: 'Labor' },
  { value: 'parts', label: 'Parts' },
  { value: 'paint', label: 'Paint' },
  { value: 'sublet', label: 'Sublet' },
  { value: 'other', label: 'Other' },
];

const emptyLine = (): EstimateLineInput => ({
  line_type: 'labor',
  description: '',
  quantity: 1,
  unit_price: 0,
  is_taxable: true,
});

interface EstimateFormProps {
  initialData?: Estimate;
  onSubmit: (data: CreateEstimateInput) => Promise<void>;
  isLoading?: boolean;
}

export function EstimateForm({ initialData, onSubmit, isLoading }: EstimateFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<EstimateLineInput[]>([emptyLine()]);

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof EstimateLineInput, value: string | number | boolean) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const linesTotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data: CreateEstimateInput = {
      customer_id: (fd.get('customer_id') as string).trim(),
      vehicle_id: (fd.get('vehicle_id') as string).trim(),
      lines: lines.map((l, i) => ({ ...l, sort_order: i + 1 })),
    };

    const opt = (k: string) => { const v = (fd.get(k) as string)?.trim(); return v || undefined; };
    data.claim_number = opt('claim_number');
    data.notes = opt('notes');
    const deductible = opt('deductible');
    if (deductible) data.deductible = parseFloat(deductible);
    data.valid_until = opt('valid_until');

    const newErrors: Record<string, string> = {};
    if (!data.customer_id) newErrors.customer_id = 'Customer ID is required';
    if (!data.vehicle_id) newErrors.vehicle_id = 'Vehicle ID is required';
    if (!lines.length) newErrors.lines = 'At least one line item is required';
    lines.forEach((l, i) => {
      if (!l.description.trim()) newErrors[`line_${i}_desc`] = `Line ${i + 1}: description required`;
      if (l.unit_price <= 0) newErrors[`line_${i}_price`] = `Line ${i + 1}: price must be > 0`;
    });

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
        <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="claim_number">Claim Number</Label>
            <Input id="claim_number" name="claim_number" defaultValue={initialData?.claim_number || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deductible">Deductible ($)</Label>
            <Input id="deductible" name="deductible" type="number" step="0.01" min="0" defaultValue={initialData?.deductible || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Valid Until</Label>
            <Input id="valid_until" name="valid_until" type="date" defaultValue={initialData?.valid_until?.slice(0, 10) || ''} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>+ Add Line</Button>
        </div>
        {errors.lines && <p className="text-xs text-destructive">{errors.lines}</p>}

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 rounded-md border p-3 sm:grid-cols-12">
              <div className="sm:col-span-2">
                <Select value={line.line_type} onChange={(e) => updateLine(idx, 'line_type', e.target.value)}>
                  {LINE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Input placeholder="Description" value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} />
                {errors[`line_${idx}_desc`] && <p className="text-xs text-destructive">{errors[`line_${idx}_desc`]}</p>}
              </div>
              <div className="sm:col-span-2">
                <Input type="number" placeholder="Qty" min={1} step={1} value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="sm:col-span-2">
                <Input type="number" placeholder="Unit $" min={0} step={0.01} value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                {errors[`line_${idx}_price`] && <p className="text-xs text-destructive">{errors[`line_${idx}_price`]}</p>}
              </div>
              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-sm font-medium">${(line.quantity * line.unit_price).toFixed(2)}</span>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeLine(idx)}>X</Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-right text-lg font-semibold">
          Subtotal: ${linesTotal.toFixed(2)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Textarea id="notes" name="notes" defaultValue={initialData?.notes || ''} rows={3} />
      </section>

      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Estimate' : 'Create Estimate'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
