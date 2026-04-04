'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateTransactionInput } from '@/hooks/use-financial';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'ach', label: 'ACH' },
  { value: 'wire', label: 'Wire' },
  { value: 'insurance_payment', label: 'Insurance Payment' },
];

const CATEGORIES = {
  income: ['PDR Revenue', 'Paint & Body', 'Insurance Payment', 'Rental Revenue', 'Other Revenue'],
  expense: ['Parts', 'Sublet Services', 'Payroll', 'Contractor Payments', 'Rent', 'Utilities', 'Insurance', 'Marketing', 'Office Supplies', 'Other Expense'],
};

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionForm({ onSubmit, isLoading }: TransactionFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [txType, setTxType] = useState<'income' | 'expense'>('income');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data: CreateTransactionInput = {
      transaction_type: txType,
      category: (fd.get('category') as string).trim(),
      description: (fd.get('description') as string).trim(),
      amount: parseFloat(fd.get('amount') as string),
      payment_method: (fd.get('payment_method') as string),
      transaction_date: (fd.get('transaction_date') as string),
    };

    const ref = (fd.get('reference_number') as string)?.trim();
    if (ref) data.reference_number = ref;

    const newErrors: Record<string, string> = {};
    if (!data.category) newErrors.category = 'Category is required';
    if (!data.description) newErrors.description = 'Description is required';
    if (!data.amount || data.amount <= 0) newErrors.amount = 'Amount must be > 0';
    if (!data.transaction_date) newErrors.transaction_date = 'Date is required';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    try { await onSubmit(data); } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong' });
    }
  };

  const categories = CATEGORIES[txType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{errors.form}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-2">
            <Button type="button" variant={txType === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => setTxType('income')}>Income</Button>
            <Button type="button" variant={txType === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => setTxType('expense')}>Expense</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select id="category" name="category">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" name="description" rows={2} />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select id="payment_method" name="payment_method" defaultValue="cash">
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Date *</Label>
          <Input id="transaction_date" name="transaction_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          {errors.transaction_date && <p className="text-xs text-destructive">{errors.transaction_date}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference_number">Reference Number</Label>
        <Input id="reference_number" name="reference_number" placeholder="Check #, Invoice #, etc." />
      </div>

      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Record Transaction'}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
