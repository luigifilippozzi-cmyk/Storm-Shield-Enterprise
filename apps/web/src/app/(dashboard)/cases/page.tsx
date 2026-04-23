'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCases, useDeleteCase, useCreateCase, type CaseFilters, type CaseStatus, type CasePriority, type CaseType, type CreateCaseInput } from '@/hooks/use-cases';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

// ── Display maps ──

const STATUS_LABELS: Record<CaseStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<CaseStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS: Record<CasePriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<CaseType, string> = {
  complaint: 'Complaint',
  quality_issue: 'Quality Issue',
  refund_request: 'Refund Request',
  general_inquiry: 'General Inquiry',
  other: 'Other',
};

// ── New Case Modal ──

function NewCaseModal({ onClose }: { onClose: () => void }) {
  const createCase = useCreateCase();
  const [form, setForm] = useState<CreateCaseInput>({
    case_type: 'general_inquiry',
    title: '',
    body: '',
    priority: 'medium',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createCase.mutateAsync(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-case-title"
    >
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <h2 id="new-case-title" className="mb-4 text-xl font-semibold">Open New Case</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="case_type" className="mb-1 block text-sm font-medium">Type</label>
            <Select
              id="case_type"
              value={form.case_type}
              onChange={(e) => setForm((p) => ({ ...p, case_type: e.target.value as CaseType }))}
              className="w-full"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium">Priority</label>
            <Select
              id="priority"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as CasePriority }))}
              className="w-full"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">Title</label>
            <input
              id="title"
              type="text"
              required
              minLength={1}
              maxLength={255}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief description of the issue"
            />
          </div>
          <div>
            <label htmlFor="body" className="mb-1 block text-sm font-medium">Details</label>
            <textarea
              id="body"
              required
              minLength={1}
              rows={4}
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Provide full context..."
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createCase.isPending}>
              {createCase.isPending ? 'Opening...' : 'Open Case'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CasesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<CaseFilters>({ page: 1, limit: 20 });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading, error } = useCases(filters);
  const deleteCase = useDeleteCase();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete case "${title}"?`)) return;
    deleteCase.mutate(id);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {showNew && <NewCaseModal onClose={() => setShowNew(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cases</h1>
        <Button onClick={() => setShowNew(true)}>+ Open Case</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <Select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters((p) => ({ ...p, status: (e.target.value as CaseStatus) || undefined, page: 1 }))
          }
          className="w-40"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>

        <Select
          value={filters.priority || ''}
          onChange={(e) =>
            setFilters((p) => ({ ...p, priority: (e.target.value as CasePriority) || undefined, page: 1 }))
          }
          className="w-36"
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>

        <Select
          value={filters.case_type || ''}
          onChange={(e) =>
            setFilters((p) => ({ ...p, case_type: (e.target.value as CaseType) || undefined, page: 1 }))
          }
          className="w-44"
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>

        {(filters.status || filters.priority || filters.case_type) && (
          <Button
            variant="ghost"
            onClick={() => setFilters({ page: 1, limit: 20 })}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-12" aria-label="Loading cases">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-destructive" role="alert">
            Failed to load cases: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No cases found</p>
            <p className="mt-1 text-sm">
              {filters.status || filters.priority || filters.case_type
                ? 'Try adjusting your filters.'
                : 'Open a new case to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Cases list">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opened</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/cases/${c.id}`)}
                    tabIndex={0}
                    role="row"
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/cases/${c.id}`)}
                    aria-label={`Case: ${c.title}`}
                  >
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[c.case_type] ?? c.case_type}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-transparent', STATUS_COLORS[c.status])}>
                        {STATUS_LABELS[c.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-transparent', PRIORITY_COLORS[c.priority])}>
                        {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.opened_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(c.id, c.title)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} cases
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
            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4));
              const page = start + i;
              if (page > meta.totalPages) return null;
              return (
                <Button
                  key={page}
                  variant={page === meta.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((p) => ({ ...p, page }))}
                >
                  {page}
                </Button>
              );
            })}
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
    </div>
  );
}
