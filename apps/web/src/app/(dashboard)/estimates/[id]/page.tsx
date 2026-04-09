'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEstimate, useUpdateEstimateStatus, useDeleteEstimate, useCreateSupplement } from '@/hooks/use-estimates';
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
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  supplement_requested: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-purple-100 text-purple-800',
};

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: 'Send to Customer', next: 'sent' }],
  sent: [{ label: 'Mark Approved', next: 'approved' }, { label: 'Mark Rejected', next: 'rejected' }],
  approved: [{ label: 'Convert to Service Order', next: 'converted' }],
  rejected: [{ label: 'Reopen as Draft', next: 'draft' }],
  supplement_requested: [{ label: 'Mark Approved', next: 'approved' }],
  converted: [],
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

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: estimate, isLoading, error } = useEstimate(id);
  const updateStatus = useUpdateEstimateStatus(id);
  const deleteEstimate = useDeleteEstimate();
  const createSupplement = useCreateSupplement(id);
  const [showSupplementForm, setShowSupplementForm] = useState(false);

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

  const transitions = STATUS_TRANSITIONS[estimate.status] || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/estimates" className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Estimates</Link>
          <h1 className="text-3xl font-bold">Estimate {estimate.estimate_number}</h1>
        </div>
        <div className="flex gap-2">
          {transitions.map((t) => (
            <Button key={t.next} variant="outline" onClick={() => updateStatus.mutate(t.next)} disabled={updateStatus.isPending}>
              {t.label}
            </Button>
          ))}
          <Link href={`/estimates/${estimate.id}/edit`}><Button variant="outline">Edit</Button></Link>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <Badge className={cn('border-transparent', STATUS_COLORS[estimate.status])}>
        {estimate.status.replace('_', ' ').toUpperCase()}
      </Badge>

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
                        {s.status.replace('_', ' ').toUpperCase()}
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
          <DetailRow label="ID" value={<code className="text-xs">{estimate.id}</code>} />
        </dl>
      </section>
    </div>
  );
}
