'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServiceOrder, useUpdateServiceOrderStatus, useDeleteServiceOrder, useForceProgress } from '@/hooks/use-service-orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  waiting_parts: 'bg-yellow-100 text-yellow-800',
  waiting_approval: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  pending: [{ label: 'Start Work', next: 'in_progress' }],
  in_progress: [
    { label: 'Waiting Parts', next: 'waiting_parts' },
    { label: 'Mark Completed', next: 'completed' },
  ],
  waiting_parts: [{ label: 'Resume Work', next: 'in_progress' }],
  waiting_approval: [{ label: 'Mark Completed', next: 'completed' }],
  completed: [{ label: 'Mark Delivered', next: 'delivered' }],
  delivered: [],
  cancelled: [],
};

const FORCE_PROGRESS_TARGETS: Record<string, { label: string; next: string }[]> = {
  pending: [{ label: 'Force Start', next: 'in_progress' }],
  in_progress: [{ label: 'Force Complete', next: 'completed' }],
  waiting_parts: [{ label: 'Force Resume', next: 'in_progress' }],
  waiting_approval: [{ label: 'Force Complete', next: 'completed' }],
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-3 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

function ForceProgressModal({ soId, currentStatus, onClose }: { soId: string; currentStatus: string; onClose: () => void }) {
  const forceProgress = useForceProgress(soId);
  const targets = FORCE_PROGRESS_TARGETS[currentStatus] || [];
  const [target, setTarget] = useState(targets[0]?.next ?? 'in_progress');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) return;
    await forceProgress.mutateAsync({ target_status: target, reason: reason.trim() });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="force-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2 id="force-modal-title" className="mb-1 text-lg font-semibold">Force Progress (Owner)</h2>
        <p className="mb-4 text-sm text-muted-foreground">This will override the dispute lock. The action will be recorded in the audit log.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {targets.length > 1 && (
            <div>
              <label htmlFor="force-target" className="mb-1 block text-sm font-medium">Target Status</label>
              <select
                id="force-target"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                {targets.map((t) => (
                  <option key={t.next} value={t.next}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="force-reason" className="mb-1 block text-sm font-medium">Reason <span className="text-destructive">*</span></label>
            <textarea
              id="force-reason"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              minLength={10}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are overriding the dispute lock (min 10 characters)..."
            />
            {reason.length > 0 && reason.trim().length < 10 && (
              <p className="mt-1 text-xs text-destructive">Reason must be at least 10 characters.</p>
            )}
          </div>
          {forceProgress.error && (
            <p className="text-sm text-destructive">{forceProgress.error instanceof Error ? forceProgress.error.message : 'Failed to force progress'}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={forceProgress.isPending}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={forceProgress.isPending || reason.trim().length < 10}>
              {forceProgress.isPending ? 'Forcing...' : 'Confirm Force Progress'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, error } = useServiceOrder(id);
  const updateStatus = useUpdateServiceOrderStatus(id);
  const deleteOrder = useDeleteServiceOrder();
  const [showForceModal, setShowForceModal] = useState(false);

  const handleDelete = async () => {
    if (!order) return;
    if (!confirm('Delete this service order?')) return;
    await deleteOrder.mutateAsync(order.id);
    router.push('/service-orders');
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (error || !order) return (
    <div className="space-y-4">
      <p className="text-destructive">{error ? `Failed to load: ${error.message}` : 'Service order not found'}</p>
      <Link href="/service-orders"><Button variant="outline">Back</Button></Link>
    </div>
  );

  const isPaused = order.is_paused_by_dispute;
  const transitions = isPaused ? [] : (STATUS_TRANSITIONS[order.status] || []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {showForceModal && (
        <ForceProgressModal soId={order.id} currentStatus={order.status} onClose={() => setShowForceModal(false)} />
      )}

      <div className="flex items-start justify-between">
        <div>
          <Link href="/service-orders" className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Service Orders</Link>
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => (
            <Button key={t.next} variant="outline" onClick={() => updateStatus.mutate(t.next)} disabled={updateStatus.isPending}>{t.label}</Button>
          ))}
          {isPaused && (FORCE_PROGRESS_TARGETS[order.status]?.length ?? 0) > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowForceModal(true)}>
              Force Progress
            </Button>
          )}
          <Link href={`/service-orders/${order.id}/edit`}><Button variant="outline">Edit</Button></Link>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn('border-transparent', STATUS_COLORS[order.status])}>
          {order.status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
        {isPaused && (
          <Badge className="border-transparent bg-red-200 text-red-900 font-medium">
            Paused by Dispute
          </Badge>
        )}
      </div>

      {isPaused && (
        <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-900">Service order is paused due to a disputed estimate.</p>
          <p className="text-sm text-red-700">Status transitions are blocked. Resolve the linked estimate dispute, or use <strong>Force Progress</strong> (Owner only) to override.</p>
        </section>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Financials</h2></div>
        <dl className="px-4">
          <DetailRow label="Total Labor" value={`$${parseFloat(order.total_labor_hours).toFixed(2)} hrs`} />
          <DetailRow label="Parts Cost" value={`$${parseFloat(order.total_parts_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
          <DetailRow label="Total Amount" value={<span className="text-lg font-bold">${parseFloat(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} />
        </dl>
      </section>

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Timeline</h2></div>
        <dl className="px-4">
          <DetailRow label="Created" value={formatDate(order.created_at)} />
          <DetailRow label="Started" value={order.started_at ? formatDate(order.started_at) : null} />
          <DetailRow label="Est. Completion" value={order.estimated_completion ? formatDate(order.estimated_completion) : null} />
          <DetailRow label="Completed" value={order.completed_at ? formatDate(order.completed_at) : null} />
          <DetailRow label="Delivered" value={order.delivered_at ? formatDate(order.delivered_at) : null} />
        </dl>
      </section>

      {order.notes && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3"><h2 className="font-semibold">Notes</h2></div>
          <div className="whitespace-pre-wrap px-4 py-3 text-sm">{order.notes}</div>
        </section>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Record Info</h2></div>
        <dl className="px-4">
          <DetailRow label="ID" value={<code className="text-xs">{order.id}</code>} />
          <DetailRow label="Estimate ID" value={<code className="text-xs">{order.estimate_id}</code>} />
        </dl>
      </section>
    </div>
  );
}
