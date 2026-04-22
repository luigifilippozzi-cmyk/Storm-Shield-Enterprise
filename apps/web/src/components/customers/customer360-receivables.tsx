'use client';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useTransactions } from '@/hooks/use-financial';
import { useCustomerSummary } from '@/hooks/use-customers';

export function Customer360Receivables({ customerId }: { customerId: string }) {
  const { data: txData, isLoading: txLoading, error: txError } = useTransactions({
    customer_id: customerId,
    limit: 50,
  });
  const { data: summary } = useCustomerSummary(customerId);

  const formatCurrency = (n: number | string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

  const transactions = txData?.data ?? [];
  const income = transactions.filter((t) => t.transaction_type === 'income');
  const expenses = transactions.filter((t) => t.transaction_type === 'expense');

  if (txLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (txError) {
    return <p className="text-sm text-destructive">Failed to load payments: {txError.message}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(summary?.balance ?? 0)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">YTD Revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(summary?.ytd_revenue ?? 0)}</p>
        </div>
      </div>

      {/* Income */}
      <section>
        <h3 className="mb-2 text-sm font-semibold">Payments Received</h3>
        {income.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">No payments recorded.</p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {income.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.transaction_date)} · {t.payment_method?.replace('_', ' ')}</p>
                </div>
                <span className="text-sm font-semibold text-green-700">{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Expenses */}
      {expenses.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Expenses</h3>
          <div className="divide-y rounded-lg border">
            {expenses.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.transaction_date)}</p>
                </div>
                <span className="text-sm font-semibold text-red-700">-{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
