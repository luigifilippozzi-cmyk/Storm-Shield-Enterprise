'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCase, useUpdateCase, useResolveCase, type CaseStatus, type CasePriority } from '@/hooks/use-cases';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';

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

// ── Resolve Modal ──

function ResolveModal({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const resolve = useResolveCase(caseId);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await resolve.mutateAsync(notes || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve case');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-case-title"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 id="resolve-case-title" className="mb-4 text-xl font-semibold">Resolve Case</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="resolution_notes" className="mb-1 block text-sm font-medium">
              Resolution notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="resolution_notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe how this case was resolved..."
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={resolve.isPending}>
              {resolve.isPending ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [showResolve, setShowResolve] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data: caseRecord, isLoading, error } = useCase(params.id);
  const updateCase = useUpdateCase(params.id);

  const handleStatusChange = async (status: CaseStatus) => {
    setUpdateError(null);
    try {
      await updateCase.mutateAsync({ status });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handlePriorityChange = async (priority: CasePriority) => {
    setUpdateError(null);
    try {
      await updateCase.mutateAsync({ priority });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" aria-label="Loading case">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !caseRecord) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive" role="alert">
          {error instanceof Error ? error.message : 'Case not found'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/cases')}>
          Back to Cases
        </Button>
      </div>
    );
  }

  const canResolve = caseRecord.status === 'in_progress';
  const isClosed = caseRecord.status === 'closed' || caseRecord.status === 'resolved';

  return (
    <div className="space-y-6">
      {showResolve && (
        <ResolveModal caseId={params.id} onClose={() => setShowResolve(false)} />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/cases')}>
            ← Cases
          </Button>
          <h1 className="text-2xl font-bold">{caseRecord.title}</h1>
          <Badge className={cn('border-transparent', STATUS_COLORS[caseRecord.status])}>
            {STATUS_LABELS[caseRecord.status]}
          </Badge>
          <Badge className={cn('border-transparent', PRIORITY_COLORS[caseRecord.priority])}>
            {caseRecord.priority.charAt(0).toUpperCase() + caseRecord.priority.slice(1)}
          </Badge>
        </div>
        <div className="flex gap-2">
          {canResolve && (
            <Button onClick={() => setShowResolve(true)}>Mark Resolved</Button>
          )}
        </div>
      </div>

      {updateError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {updateError}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-2 font-semibold">Details</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{caseRecord.body}</p>
          </div>

          {caseRecord.resolution_notes && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h2 className="mb-2 font-semibold text-green-800">Resolution Notes</h2>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{caseRecord.resolution_notes}</p>
              {caseRecord.resolved_at && (
                <p className="mt-2 text-xs text-green-600">
                  Resolved on {formatDate(caseRecord.resolved_at)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h2 className="font-semibold">Case Info</h2>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
              <p className="text-sm capitalize">{caseRecord.case_type.replace(/_/g, ' ')}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Opened</p>
              <p className="text-sm">{formatDate(caseRecord.opened_at)}</p>
            </div>

            {caseRecord.customer_id && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Customer ID</p>
                <p className="text-sm font-mono text-xs">{caseRecord.customer_id}</p>
              </div>
            )}

            {!isClosed && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
                  <Select
                    value={caseRecord.status}
                    onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                    className="mt-1 w-full text-sm"
                    disabled={updateCase.isPending}
                    aria-label="Update case status"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</label>
                  <Select
                    value={caseRecord.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as CasePriority)}
                    className="mt-1 w-full text-sm"
                    disabled={updateCase.isPending}
                    aria-label="Update case priority"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
