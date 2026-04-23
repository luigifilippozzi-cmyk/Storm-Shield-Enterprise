'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import { isWorkspaceAccessible } from '@/lib/workspace';
import { useEstimates } from '@/hooks/use-estimates';
import { useInsuranceCompanies } from '@/hooks/use-insurance';
import { EstimateStatusBadge, ESTIMATE_STATUS_CONFIG } from '@/components/estimates/estimate-status-badge';
import { EstimatesKanban, EstimatesKanbanSkeleton } from '@/components/estimates/estimates-kanban';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';

const ALL_STATUSES = Object.keys(ESTIMATE_STATUS_CONFIG);

// Persist view preference in localStorage (DM decision: avoids extra round-trip
// to user_settings table; preference is UI-only and non-critical).
const VIEW_PREF_KEY = 'sse_estimates_inbox_view';

function getInitialView(): 'table' | 'kanban' {
  if (typeof window === 'undefined') return 'table';
  return (localStorage.getItem(VIEW_PREF_KEY) as 'table' | 'kanban') ?? 'table';
}

interface InboxFilters {
  statuses: string[];
  insurance_company_id?: string;
  date_from?: string;
  date_to?: string;
  scope: 'mine' | 'all';
  search?: string;
  page: number;
  limit: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

function StatusToggle({ status, active, onToggle }: { status: string; active: boolean; onToggle: () => void }) {
  const config = ESTIMATE_STATUS_CONFIG[status];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity',
        active ? config.className : 'border-gray-200 bg-gray-50 text-gray-500 opacity-60',
      )}
    >
      {config.label}
    </button>
  );
}

function EstimatesInboxContent() {
  const router = useRouter();
  const { data: workspace, isLoading: wsLoading } = useWorkspaceInfo();

  const [view, setView] = useState<'table' | 'kanban'>('table');

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setView(getInitialView());
  }, []);

  const handleViewChange = (v: 'table' | 'kanban') => {
    setView(v);
    localStorage.setItem(VIEW_PREF_KEY, v);
  };

  const [filters, setFilters] = useState<InboxFilters>({
    statuses: [],
    scope: 'mine',
    page: 1,
    limit: 25,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data: insurers } = useInsuranceCompanies({ limit: 200 });

  // Kanban fetches all estimates (no pagination) matching current filters
  const kanbanFilters = {
    ...(filters.statuses.length > 0 ? { statuses: filters.statuses.join(',') } : {}),
    ...(filters.insurance_company_id ? { insurance_company_id: filters.insurance_company_id } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    scope: filters.scope,
    limit: 500,
    sort_by: 'created_at',
    sort_order: 'desc' as const,
  };

  const tableFilters = {
    ...(filters.statuses.length > 0 ? { statuses: filters.statuses.join(',') } : {}),
    ...(filters.insurance_company_id ? { insurance_company_id: filters.insurance_company_id } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    scope: filters.scope,
    page: filters.page,
    limit: filters.limit,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };

  const { data, isLoading, error } = useEstimates(view === 'kanban' ? kanbanFilters : tableFilters);
  const meta = data?.meta;

  useEffect(() => {
    if (!wsLoading && workspace && !isWorkspaceAccessible('estimates-inbox', workspace.roles)) {
      router.replace('/403');
    }
  }, [wsLoading, workspace, router]);

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  const handleSort = (col: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: col,
      sort_order: prev.sort_by === col && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ statuses: [], scope: 'mine', page: 1, limit: 25, sort_by: 'created_at', sort_order: 'desc' });
  };

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    !!filters.insurance_company_id ||
    !!filters.date_from ||
    !!filters.date_to ||
    !!filters.search;

  const sortArrow = (col: string) =>
    filters.sort_by === col ? (filters.sort_order === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimates Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, filter, and act on estimates by status and adjuster
          </p>
        </div>
        <Link href="/estimates/new">
          <Button>+ New Estimate</Button>
        </Link>
      </div>

      {/* Top controls row: scope toggle + view toggle */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Scope toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">View:</span>
          <div className="flex rounded-md border">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, scope: 'mine', page: 1 }))}
              aria-pressed={filters.scope === 'mine'}
              className={cn(
                'rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors',
                filters.scope === 'mine'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              My Estimates
            </button>
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, scope: 'all', page: 1 }))}
              aria-pressed={filters.scope === 'all'}
              className={cn(
                'rounded-r-md border-l px-3 py-1.5 text-sm font-medium transition-colors',
                filters.scope === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              All Estimates
            </button>
          </div>
          {meta && (
            <span className="text-sm text-muted-foreground">
              {meta.total} result{meta.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* View toggle (table ↔ kanban) */}
        <div
          className="ml-auto flex items-center gap-2"
          role="group"
          aria-label="Switch between table and kanban view"
        >
          <span className="text-sm font-medium text-muted-foreground">Layout:</span>
          <div className="flex rounded-md border">
            <button
              type="button"
              onClick={() => handleViewChange('table')}
              aria-pressed={view === 'table'}
              className={cn(
                'rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'table'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('kanban')}
              aria-pressed={view === 'kanban'}
              className={cn(
                'rounded-r-md border-l px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'kanban'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Status multi-select chips */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filter by status</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter estimates by status">
          {ALL_STATUSES.map((s) => (
            <StatusToggle
              key={s}
              status={s}
              active={filters.statuses.includes(s)}
              onToggle={() => toggleStatus(s)}
            />
          ))}
          {filters.statuses.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, statuses: [], page: 1 }))}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Clear status
            </button>
          )}
        </div>
      </div>

      {/* Other filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search estimate #, claim #, customer…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
            aria-label="Search estimates"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="adjuster-select">
            Adjuster (Insurance Co.)
          </label>
          <select
            id="adjuster-select"
            value={filters.insurance_company_id ?? ''}
            onChange={(e) =>
              setFilters((p) => ({ ...p, insurance_company_id: e.target.value || undefined, page: 1 }))
            }
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Adjusters</option>
            {insurers?.data.map((ins) => (
              <option key={ins.id} value={ins.id}>{ins.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="date-from">From</label>
          <Input
            id="date-from"
            type="date"
            value={filters.date_from ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value || undefined, page: 1 }))}
            className="w-36"
            aria-label="Filter from date"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="date-to">To</label>
          <Input
            id="date-to"
            type="date"
            value={filters.date_to ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value || undefined, page: 1 }))}
            className="w-36"
            aria-label="Filter to date"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="self-end">
            Clear all
          </Button>
        )}
      </div>

      {/* Loading / error states */}
      {isLoading ? (
        view === 'kanban' ? (
          <EstimatesKanbanSkeleton />
        ) : (
          <div className="space-y-2 rounded-lg border p-4" aria-label="Loading estimates" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )
      ) : error ? (
        <p className="p-8 text-center text-destructive" role="alert">
          Failed to load estimates: {(error as Error).message}
        </p>
      ) : view === 'kanban' ? (
        /* ── Kanban view ── */
        <EstimatesKanban estimates={data?.data ?? []} />
      ) : (
        /* ── Table view ── */
        <>
          <div className="rounded-lg border">
            {!data?.data.length ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No estimates found</p>
                <p className="mt-1 text-sm">
                  {hasActiveFilters
                    ? 'Try adjusting your filters.'
                    : 'Create your first estimate to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Estimates inbox">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th
                        scope="col"
                        className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort('estimate_number')}
                      >
                        Estimate #{sortArrow('estimate_number')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th
                        scope="col"
                        className="cursor-pointer px-4 py-3 text-right font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort('total')}
                      >
                        Total{sortArrow('total')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Claim #</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Adjuster</th>
                      <th
                        scope="col"
                        className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort('created_at')}
                      >
                        Created{sortArrow('created_at')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((est: any) => (
                      <tr
                        key={est.id}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                        onClick={() => router.push(`/estimates/${est.id}`)}
                      >
                        <td className="px-4 py-3 font-medium font-mono">{est.estimate_number}</td>
                        <td className="px-4 py-3 text-muted-foreground">{est.customer_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <EstimateStatusBadge status={est.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          ${parseFloat(est.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{est.claim_number ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{est.insurance_company_name ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(est.created_at)}</td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/estimates/${est.id}/edit`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination (table view only) */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of{' '}
                {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setFilters((p) => ({ ...p, page: meta.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setFilters((p) => ({ ...p, page: meta.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EstimatesInboxPage() {
  return <EstimatesInboxContent />;
}
