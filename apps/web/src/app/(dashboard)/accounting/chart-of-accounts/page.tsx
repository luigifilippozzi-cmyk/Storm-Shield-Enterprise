'use client';

import { useState } from 'react';
import { useAccounts, type AccountFilters, type AccountType } from '@/hooks/use-chart-of-accounts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
};

const RANGE_LABELS: Record<AccountType, string> = {
  asset: '1000–1999',
  liability: '2000–2999',
  equity: '3000–3999',
  revenue: '4000–4999',
  expense: '5000–9999',
};

export default function ChartOfAccountsPage() {
  const [filters, setFilters] = useState<AccountFilters>({ limit: 50 });
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useAccounts(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chart of Accounts</h1>
        {data && (
          <span className="text-sm text-muted-foreground">{data.meta.total} accounts</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by number or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
          {filters.search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setFilters((f) => ({ ...f, search: undefined, page: 1 })); }}
              className="h-9 rounded-md border px-3 text-sm hover:bg-accent"
            >
              Clear
            </button>
          )}
        </form>

        <select
          aria-label="Filter by type"
          value={filters.account_type ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, account_type: (e.target.value || undefined) as AccountType | undefined, page: 1 }))}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
            <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]} ({RANGE_LABELS[t]})</option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={filters.is_active === undefined ? '' : String(filters.is_active)}
          onChange={(e) => {
            const v = e.target.value;
            setFilters((f) => ({ ...f, is_active: v === '' ? undefined : v === 'true', page: 1 }));
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading accounts…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-destructive">
            Failed to load accounts. Please try again.
          </div>
        ) : !data?.data.length ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            No accounts found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Normal Balance</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.map((account) => (
                <tr key={account.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{account.account_number}</td>
                  <td className="px-4 py-3">
                    <span className={cn(account.is_system && 'text-muted-foreground italic')}>
                      {account.name}
                    </span>
                    {account.is_system && (
                      <span className="ml-2 text-xs text-muted-foreground">(system)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', ACCOUNT_TYPE_COLORS[account.account_type])}>
                      {ACCOUNT_TYPE_LABELS[account.account_type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{account.normal_balance}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      account.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500',
                    )}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              disabled={(filters.page ?? 1) <= 1}
              className="h-8 rounded border px-3 text-xs disabled:opacity-40 hover:bg-accent"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              disabled={(filters.page ?? 1) >= data.meta.totalPages}
              className="h-8 rounded border px-3 text-xs disabled:opacity-40 hover:bg-accent"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
