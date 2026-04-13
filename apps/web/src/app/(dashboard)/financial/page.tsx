'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialDashboard, useTransactions, useDeleteTransaction, useCreateTransaction, type TransactionFilters, type CreateTransactionInput } from '@/hooks/use-financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { TransactionForm } from '@/components/financial/transaction-form';
import { TrendChart } from '@/components/financial/trend-chart';

const TYPE_COLORS: Record<string, string> = {
  income: 'bg-green-100 text-green-800',
  expense: 'bg-red-100 text-red-800',
  transfer: 'bg-blue-100 text-blue-800',
};

export default function FinancialPage() {
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 20, sort_by: 'transaction_date', sort_order: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: dashboard, isLoading: dashboardLoading } = useFinancialDashboard();
  const summary = dashboard?.summary;
  const summaryLoading = dashboardLoading;
  const { data, isLoading, error } = useTransactions(filters);
  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((p) => ({ ...p, search: searchInput || undefined, page: 1 }));
  };

  const handleCreateTransaction = async (input: CreateTransactionInput) => {
    await createTransaction.mutateAsync(input);
    setShowForm(false);
  };

  const fmt = (n: number | undefined) =>
    n !== undefined ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014';

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Transaction'}</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {summaryLoading ? '\u2014' : fmt(summary?.total_income)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {summaryLoading ? '\u2014' : fmt(summary?.total_expenses)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Net Balance</p>
          <p className={cn('mt-2 text-2xl font-bold', summary && summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600')}>
            {summaryLoading ? '\u2014' : fmt(summary?.net_balance)}
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      {!dashboardLoading && dashboard?.monthly_trend && dashboard.monthly_trend.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Monthly Trend</h2>
          <TrendChart data={dashboard.monthly_trend} />
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Record Transaction</h2>
          <TransactionForm onSubmit={handleCreateTransaction} isLoading={createTransaction.isPending} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Search description..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-64" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Select value={filters.transaction_type || ''} onChange={(e) => setFilters((p) => ({ ...p, transaction_type: e.target.value || undefined, page: 1 }))} className="w-40">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        {(filters.search || filters.transaction_type) && (
          <Button variant="ghost" onClick={() => { setSearchInput(''); setFilters({ page: 1, limit: 20, sort_by: 'transaction_date', sort_order: 'desc' }); }}>Clear</Button>
        )}
      </div>

      {/* Transaction List */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : error ? (
          <p className="p-8 text-center text-destructive">Failed to load: {error.message}</p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((tx) => (
                  <tr key={tx.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(tx.transaction_date)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-transparent capitalize', TYPE_COLORS[tx.transaction_type])}>
                        {tx.transaction_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{tx.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.description}</td>
                    <td className={cn('px-4 py-3 text-right font-medium', tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600')}>
                      {tx.transaction_type === 'expense' ? '-' : '+'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{tx.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this transaction?')) deleteTransaction.mutate(tx.id); }}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: meta.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((p) => ({ ...p, page: meta.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
