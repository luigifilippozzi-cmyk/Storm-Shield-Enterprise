'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerCombobox } from '@/components/shared/customer-combobox';
import { VehicleCombobox } from '@/components/shared/vehicle-combobox';
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

/** Multi-step wizard steps (B2-2) */
const STEPS = [
  { id: 1, label: 'Customer & Vehicle' },
  { id: 2, label: 'Line Items' },
  { id: 3, label: 'Details & Review' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

// ── Step indicator — defined outside component to avoid identity change per render (Low fix) ──
interface StepIndicatorProps {
  currentStep: StepId;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Estimate creation steps">
      <ol className="flex items-center gap-0">
        {STEPS.map((s, idx) => {
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;
          return (
            <li key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors
                    ${isDone ? 'border-primary bg-primary text-primary-foreground' : isActive ? 'border-primary bg-background text-primary' : 'border-muted bg-muted text-muted-foreground'}`}
                >
                  {isDone ? '✓' : s.id}
                </div>
                <span className={`mt-1 text-xs font-medium ${isActive ? 'text-primary' : isDone ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${isDone ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─────────────────────────────────────────────

interface EstimateFormProps {
  initialData?: Estimate;
  onSubmit: (data: CreateEstimateInput) => Promise<void>;
  isLoading?: boolean;
}

export function EstimateForm({ initialData, onSubmit, isLoading }: EstimateFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 state — IDs + human-readable labels for the review step (Medium fix)
  const [customerId, setCustomerId] = useState(initialData?.customer_id || '');
  const [customerLabel, setCustomerLabel] = useState('');
  const [vehicleId, setVehicleId] = useState(initialData?.vehicle_id || '');
  const [vehicleLabel, setVehicleLabel] = useState('');

  // Step 2 state
  const [lines, setLines] = useState<EstimateLineInput[]>([emptyLine()]);

  // Step 3 state
  const [claimNumber, setClaimNumber] = useState(initialData?.claim_number || '');
  const [deductible, setDeductible] = useState(initialData?.deductible?.toString() || '');
  const [validUntil, setValidUntil] = useState(initialData?.valid_until?.slice(0, 10) || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const linesTotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  // ── Line helpers ──
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof EstimateLineInput, value: string | number | boolean) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  // ── Step validation ──
  const validateStep = (s: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!customerId) errs.customer_id = 'Customer is required';
      if (!vehicleId) errs.vehicle_id = 'Vehicle is required';
    }
    if (s === 2) {
      if (!lines.length) errs.lines = 'At least one line item is required';
      lines.forEach((l, i) => {
        if (!l.description.trim()) errs[`line_${i}_desc`] = `Line ${i + 1}: description required`;
        if (l.unit_price <= 0) errs[`line_${i}_price`] = `Line ${i + 1}: price must be > 0`;
      });
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length) as StepId);
  };

  const goPrev = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1) as StepId);
  };

  // ── Final submit ──
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const allErrs = { ...validateStep(1), ...validateStep(2) };
    if (Object.keys(allErrs).length > 0) { setErrors(allErrs); return; }

    const data: CreateEstimateInput = {
      customer_id: customerId,
      vehicle_id: vehicleId,
      lines: lines.map((l, i) => ({ ...l, sort_order: i + 1 })),
      claim_number: claimNumber || undefined,
      notes: notes || undefined,
      deductible: deductible ? parseFloat(deductible) : undefined,
      valid_until: validUntil || undefined,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong' });
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {errors.form}
          </div>
        )}

        {/* ── Step 1: Customer & Vehicle ── */}
        {step === 1 && (
          <section className="space-y-4" aria-labelledby="step1-heading">
            <h2 id="step1-heading" className="text-lg font-semibold">Customer &amp; Vehicle</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <CustomerCombobox
                  value={customerId}
                  onChange={(id) => { setCustomerId(id); setVehicleId(''); setVehicleLabel(''); setErrors((e) => ({ ...e, customer_id: '', vehicle_id: '' })); }}
                  onChangeWithLabel={(id, label) => setCustomerLabel(label)}
                  error={errors.customer_id}
                />
                {errors.customer_id && <p className="text-xs text-destructive" role="alert">{errors.customer_id}</p>}
              </div>
              <div className="space-y-2">
                <Label>Vehicle *</Label>
                <VehicleCombobox
                  customerId={customerId}
                  value={vehicleId}
                  onChange={(id) => { setVehicleId(id); setErrors((e) => ({ ...e, vehicle_id: '' })); }}
                  onChangeWithLabel={(id, label) => setVehicleLabel(label)}
                  error={errors.vehicle_id}
                />
                {errors.vehicle_id && <p className="text-xs text-destructive" role="alert">{errors.vehicle_id}</p>}
              </div>
            </div>
          </section>
        )}

        {/* ── Step 2: Line Items ── */}
        {step === 2 && (
          <section className="space-y-4" aria-labelledby="step2-heading">
            <div className="flex items-center justify-between">
              <h2 id="step2-heading" className="text-lg font-semibold">Line Items</h2>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>+ Add Line</Button>
            </div>
            {errors.lines && <p className="text-xs text-destructive" role="alert">{errors.lines}</p>}
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="grid gap-2 rounded-md border p-3 sm:grid-cols-12">
                  <div className="sm:col-span-2">
                    <Label className="sr-only">Type</Label>
                    <Select value={line.line_type} onChange={(e) => updateLine(idx, 'line_type', e.target.value)} aria-label={`Line ${idx + 1} type`}>
                      {LINE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                  <div className="sm:col-span-4">
                    <Label className="sr-only">Description</Label>
                    <Input placeholder="Description" value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} aria-label={`Line ${idx + 1} description`} />
                    {errors[`line_${idx}_desc`] && <p className="text-xs text-destructive" role="alert">{errors[`line_${idx}_desc`]}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="sr-only">Quantity</Label>
                    <Input type="number" placeholder="Qty" min={1} step={1} value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} aria-label={`Line ${idx + 1} quantity`} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="sr-only">Unit price</Label>
                    <Input type="number" placeholder="Unit $" min={0} step={0.01} value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)} aria-label={`Line ${idx + 1} unit price`} />
                    {errors[`line_${idx}_price`] && <p className="text-xs text-destructive" role="alert">{errors[`line_${idx}_price`]}</p>}
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <span className="text-sm font-medium">${(line.quantity * line.unit_price).toFixed(2)}</span>
                    {lines.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeLine(idx)} aria-label={`Remove line ${idx + 1}`}>×</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right text-lg font-semibold">Subtotal: ${linesTotal.toFixed(2)}</div>
          </section>
        )}

        {/* ── Step 3: Details & Review ── */}
        {step === 3 && (
          <section className="space-y-6" aria-labelledby="step3-heading">
            <h2 id="step3-heading" className="text-lg font-semibold">Details &amp; Review</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="claim_number">Claim Number</Label>
                <Input id="claim_number" value={claimNumber} onChange={(e) => setClaimNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductible">Deductible ($)</Label>
                <Input id="deductible" type="number" step="0.01" min="0" value={deductible} onChange={(e) => setDeductible(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input id="valid_until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            {/* Summary card — shows human-readable names (Medium fix) */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-base mb-3">Summary</h3>
              <dl className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="font-medium truncate">{customerLabel || customerId.slice(0, 8) + '…'}</dd>
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="font-medium truncate">{vehicleLabel || vehicleId.slice(0, 8) + '…'}</dd>
                <dt className="text-muted-foreground">Line items</dt>
                <dd>{lines.length} item{lines.length !== 1 ? 's' : ''}</dd>
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">${linesTotal.toFixed(2)}</dd>
                {claimNumber && <><dt className="text-muted-foreground">Claim #</dt><dd>{claimNumber}</dd></>}
                {deductible && <><dt className="text-muted-foreground">Deductible</dt><dd>${deductible}</dd></>}
              </dl>
            </div>
          </section>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button type="button" variant="outline" onClick={step === 1 ? () => router.back() : goPrev}>
            {step === 1 ? 'Cancel' : '← Back'}
          </Button>
          {step < STEPS.length ? (
            <Button type="button" onClick={goNext}>Next →</Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Estimate' : 'Create Estimate'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
