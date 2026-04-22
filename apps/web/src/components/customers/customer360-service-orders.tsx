'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useServiceOrders } from '@/hooks/use-service-orders';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  waiting_parts: 'bg-yellow-100 text-yellow-800',
  waiting_approval: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function Customer360ServiceOrders({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useServiceOrders({ customer_id: customerId, limit: 50 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load service orders: {error.message}</p>;
  }

  const orders = data?.data ?? [];

  const formatCurrency = (n: number | string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{orders.length} service order{orders.length !== 1 ? 's' : ''}</p>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No service orders yet.</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {orders.map((so) => (
            <Link
              key={so.id}
              href={`/service-orders/${so.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{so.order_number}</p>
                <p className="text-sm text-muted-foreground">{formatDate(so.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatCurrency(so.total_amount)}</span>
                <Badge className={`border-transparent capitalize ${STATUS_COLORS[so.status] ?? 'bg-gray-100 text-gray-800'}`}>
                  {so.status?.replace('_', ' ')}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
