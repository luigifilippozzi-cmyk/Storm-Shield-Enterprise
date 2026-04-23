'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEstimate, useUpdateEstimateStatus, useDeleteEstimate,
  useCreateSupplement, useOpenDispute, useResolveDispute,
} from '@/hooks/use-estimates';
import { EstimateDocuments } from '@/components/estimates/estimate-documents';
import { StatusTimeline } from '@/components/estimates/status-timeline';
import { SupplementForm, type SupplementFormData } from '@/components/estimates/supplement-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

interface EstimateLineItem {
  id: string;
  line_type: string;
  description: string;
  quantity: number;
  unit_price: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted_to_adjuster: 'bg-blue-100 text-blue-800',
  awaiting_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  supplement_pending: 'bg-orange-100 text-orange-800',
  approved_with_supplement: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  disputed: 'bg-red-200 text-red-900',
  paid: 'bg-green-200 text-green-900',
  closed: 'bg-gray-200 text-gray-900',
  // legacy
  sent: 'bg-blue-100 text-blue-800',
  supplement_requested: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-purple-100 text-purple-800',
};

const DISPUTE_REASONS = [
  { value: 'adjuster_underpayment', label: 'Adjuster Underpayment' },
  { value: 'supplement_rejected', label: 'Supplement Rejected' },
  { value: 'claim_denied', label: 'Claim Denied' },
  { value: 'total_loss_dispute', label: 'Total Loss Dispute' },
  { value: 'other', label: 'Other' },
];

const RESOLVE_TARGETS = [
  { value: 'awaiting_approval', label: 'Return to Awaiting Approval' },
  { value: 'paid', label: 'Mark as Paid' },
  { value: 'closed', label: 'Close Estimate' },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-3 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

function DisputeModal({ estimateId, onClose }: { estimateId: string; onClose: () => void }) {
  const openDispute = useOpenDispute(estimateId);
  const [reason, setReason] = useState('adjuster_underpayment');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await openDispute.mutateAsync({ dispute_reason: reason, dispute_notes: notes || undefined });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="dispute-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2 id="dispute-modal-title" className="mb-4 text-lg font-semibold">Open Dispute</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dispute-reason" className="mb-1 block text-sm font-medium">Dispute Reason</label>
            <select
              id="dispute-reason"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dispute-notes" className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <textarea
              id="dispute-notes"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the dispute in detail..."
            />
          </div>
          {openDispute.error && (
            <p className="text-sm text-destructive">{openDispute.error instanceof Error ? openDispute.error.message : 'Failed to open dispute'}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={openDispute.isPending}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={openDispute.isPending}>
              {openDispute.isPending ? 'Opening...' : 'Open Dispute'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResolveDisputeModal({ estimateId, onClose }: { estimateId: string; onClose: () => void }) {
  const resolveDispute = useResolveDispute(estimateId);
  const [target, setTarget] = useState('awaiting_approval');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resolveDispute.mutateAsync({ resolution_status: target, notes: notes || undefined });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="resolve-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2 id="resolve-modal-title" className="mb-4 text-lg font-semibold">Resolve Dispute</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="resolve-target" className="mb-1 block text-sm font-medium">Resolution</label>
            <select
              id="resolve-target"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {RESOLVE_TARGETS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="resolve-notes" className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <textarea
              id="resolve-notes"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolution notes..."
            />
          </div>
          {resolveDispute.error && (
            <p className="text-sm text-destructive">{resolveDispute.error instanceof Error ? resolveDispute.error.message : 'Failed to resolve dispute'}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={resolveDispute.isPending}>Cancel</Button>
            <Button type="submit" disabled={resolveDispute.isPending}>
              {resolveDispute.isPending ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const DISPUTABLE_STATUSES = new Set(['awaiting_approval', 'approved', 'approved_with_supplement']);

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: estimate, isLoading, error } = useEstimate(id);
  const updateStatus = useUpdateEstimateStatus(id);
  const deleteEstimate = useDeleteEstimate();
  const createSupplement = useCreateSupplement(id);
  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const handleDelete = async () => {
    if (!estimate) return;
    if (!confirm('Delete this estimate?')) return;
    await deleteEstimate.mutateAsync(estimate.id);
    router.push('/estimates');
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (error || !estimate) return (
    <div className="space-y-4">
      <p className="text-destructive">{error ? `Failed to load: ${error.message}` : 'Estimate not found'}</p>
      <Link href="/estimates"><Button variant="outline">Back to Estimates</Button></Link>
    </div>
  );

  const canDispute = DISPUTABLE_STATUSES.has(estimate.status);
  const isDisputed = estimate.status === 'disputed';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {showDisputeModal && <DisputeModal estimateId={estimate.id} onClose={() => setShowDisputeModal(false)} />}
      {showResolveModal && <ResolveDisputeModal estimateId={estimate.id} onClose={() => setShowResolveModal(false)} />}

      <div className="flex items-start justify-between">
        <div>
          <Link href="/estimates" className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Estimates</Link>
          <h1 className="text-3xl font-bold">Estimate {estimate.estimate_number}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canDispute && (
            <Button variant="destructive" size="sm" onClick={() => setShowDisputeModal(true)}>
              Open Dispute
            </Button>
          )}
          {isDisputed && (
            <Button variant="outline" size="sm" onClick={() => setShowResolveModal(true)}>
              Resolve Dispute
            </Button>
          )}
          <Link href={`/estimates/${estimate.id}/edit`}><Button variant="outline">Edit</Button></Link>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn('border-transparent', STATUS_COLORS[estimate.status])}>
          {estimate.status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
        {isDisputed && estimate.dispute_reason && (
          <Badge className="border-transparent bg-red-100 text-red-800 text-xs">
            {estimate.dispute_reason.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      {/* Dispute info panel */}
      {isDisputed && (
        <section className="rounded-lg border border-red-200 bg-red-50">
          <div className="border-b border-red-200 px-4 py-3">
            <h2 className="font-semibold text-red-900">Dispute Active</h2>
          </div>
          <dl className="px-4">
            <DetailRow label="Reason" value={estimate.dispute_reason?.replace(/_/g, ' ')} />
            {estimate.dispute_notes && <DetailRow label="Notes" value={estimate.dispute_notes} />}
            <DetailRow label="Opened" value={estimate.dispute_opened_at ? formatDate(estimate.dispute_opened_at) : null} />
          </dl>
          <p className="px-4 pb-3 text-sm text-red-700">Linked service orders are paused. Resolve the dispute to resume work.</p>
        </section>
      )}

      {/* Line Items */}
      {(estimate as any).lines && ((estimate as any).lines as EstimateLineItem[]).length > 0 && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3"><h2 className="font-semibold">Line Items</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                  <th className="px-4 py-2 text-right font-medium">Qty</th>
                  <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {((estimate as any).lines as EstimateLineItem[]).map((line, idx) => (
                  <tr key={line.id || idx} className="border-b last:border-0">
                    <td className="px-4 py-2 capitalize">{line.line_type}</td>
                    <td className="px-4 py-2">{line.description}</td>
                    <td className="px-4 py-2 text-right">{line.quantity}</td>
                    <td className="px-4 py-2 text-right">${parseFloat(line.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium">${(line.quantity * parseFloat(line.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td colSpan={4} className="px-4 py-2 text-right font-semibold">Subtotal</td>
                  <td className="px-4 py-2 text-right font-semibold">${parseFloat(estimate.subtotal).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Supplements */}
      <section className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Supplements</h2>
          {!showSupplementForm && (
            <Button variant="outline" size="sm" onClick={() => setShowSupplementForm(true)}>
              Add Supplement
            </Button>
          )}
        </div>
        <div className="p-4">
          {showSupplementForm && (
            <div className="mb-4 rounded-md border bg-muted/30 p-4">
              <SupplementForm
                onSubmit={async (data: SupplementFormData) => {
                  await createSupplement.mutateAsync(data);
                  setShowSupplementForm(false);
                }}
                onCancel={() => setShowSupplementForm(false)}
                isLoading={createSupplement.isPending}
              />
            </div>
          )}
          {(estimate as any).supplements && ((estimate as any).supplements as any[]).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {((estimate as any).supplements as any[]).map((s: any) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.supplement_number}</td>
                    <td className="px-3 py-2">{s.reason}</td>
                    <td className="px-3 py-2 text-right">${parseFloat(s.amount).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <Badge className={cn('border-transparent text-xs', STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800')}>
                        {s.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !showSupplementForm && <p className="text-sm text-muted-foreground">No supplements yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Details</h2></div>
        <dl className="px-4">
          <DetailRow label="Subtotal" value={`$${parseFloat(estimate.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
          <DetailRow label="Tax" value={`$${parseFloat(estimate.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
          <DetailRow label="Total" value={<span className="text-lg font-bold">${parseFloat(estimate.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>} />
          <DetailRow label="Deductible" value={estimate.deductible ? `$${parseFloat(estimate.deductible).toFixed(2)}` : null} />
          <DetailRow label="Claim #" value={estimate.claim_number} />
          <DetailRow label="Valid Until" value={estimate.valid_until ? formatDate(estimate.valid_until) : null} />
        </dl>
      </section>

      {/* Documents */}
      <EstimateDocuments estimateId={estimate.id} documents={(estimate as any).documents || []} />

      {/* Status Timeline */}
      <StatusTimeline estimate={estimate} />

      {estimate.notes && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3"><h2 className="font-semibold">Notes</h2></div>
          <div className="whitespace-pre-wrap px-4 py-3 text-sm">{estimate.notes}</div>
        </section>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Record Info</h2></div>
        <dl className="px-4">
          <DetailRow label="Created" value={formatDate(estimate.created_at)} />
          <DetailRow label="Updated" value={formatDate(estimate.updated_at)} />
          {estimate.approved_at && <DetailRow label="Approved" value={formatDate(estimate.approved_at)} />}
          {estimate.dispute_opened_at && <DetailRow label="Dispute Opened" value={formatDate(estimate.dispute_opened_at)} />}
          {estimate.dispute_resolved_at && <DetailRow label="Dispute Resolved" value={formatDate(estimate.dispute_resolved_at)} />}
          <DetailRow label="ID" value={<code className="text-xs">{estimate.id}</code>} />
        </dl>
      </section>
    </div>
  );
}
