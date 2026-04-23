'use client';

import { useState } from 'react';
import { useJournalEntries, type JournalEntryFilters, type JournalEntryStatus } from '@/hooks/use-journal-entries';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<JournalEntryStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  reversed: 'Reversed',
};

const STATUS_COLORS: Record<JournalEntryStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
  reversed: 'bg-gray-100 text-gray-600',
};

function formatAmount(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export default function JournalEntriesPage() {
  const [filters, setFilters] = useState<JournalEntryFilters>({ limit: 20 });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data, isLoading, isError } = useJournalEntries(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({
      ...f,
      search: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setFilters({ limit: 20 });
  };

  const hasActiveFilters = filters.search || filters.status || filters.date_from || filters.date_to;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Journal Entries</h1>
        {data && (
          <span className="text-sm text-muted-foreground">{data.meta.total} entries</span>
        )}
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by number or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <select
          aria-label="Filter by status"
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as JournalEntryStatus | undefined, page: 1 }))}
          className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_LABELS) as JournalEntryStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="date_from" className="text-sm text-muted-foreground">From</label>
          <input
            id="date_from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="date_to" className="text-sm text-muted-foreground">To</label>
          <input
            id="date_to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-9 rounded-md border px-3 text-sm hover:bg-accent"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading journal entries…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-destructive">
            Failed to load journal entries. Please try again.
          </div>
        ) : !data?.data.length ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            No journal entries found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entry #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Debit</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{entry.entry_number}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                    {entry.description || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', STATUS_COLORS[entry.status])}>
                      {STATUS_LABELS[entry.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatAmount(entry.total_debit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatAmount(entry.total_credit)}
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
