'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServiceOrder, useUpdateServiceOrderStatus, useDeleteServiceOrder } from '@/hooks/use-service-orders';
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-3 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, error } = useServiceOrder(id);
  const updateStatus = useUpdateServiceOrderStatus(id);
  const deleteOrder = useDeleteServiceOrder();

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

  const transitions = STATUS_TRANSITIONS[order.status] || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/service-orders" className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Service Orders</Link>
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => (
            <Button key={t.next} variant="outline" onClick={() => updateStatus.mutate(t.next)} disabled={updateStatus.isPending}>{t.label}</Button>
          ))}
          <Link href={`/service-orders/${order.id}/edit`}><Button variant="outline">Edit</Button></Link>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <Badge className={cn('border-transparent', STATUS_COLORS[order.status])}>
        {order.status.replace(/_/g, ' ').toUpperCase()}
      </Badge>

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
