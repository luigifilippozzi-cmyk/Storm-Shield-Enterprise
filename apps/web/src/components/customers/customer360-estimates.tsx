'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useEstimates } from '@/hooks/use-estimates';
import { EstimateStatusBadge } from '@/components/estimates/estimate-status-badge';

export function Customer360Estimates({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useEstimates({ customer_id: customerId, limit: 50 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Loading estimates" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load estimates: {error.message}</p>;
  }

  const estimates = data?.data ?? [];

  const formatCurrency = (n: number | string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{estimates.length} estimate{estimates.length !== 1 ? 's' : ''}</p>
        <Link href={`/estimates/new?customer_id=${customerId}`}>
          <Button size="sm" variant="outline">New Estimate</Button>
        </Link>
      </div>

      {estimates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No estimates yet.</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {estimates.map((e) => (
            <Link
              key={e.id}
              href={`/estimates/${e.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{e.estimate_number}</p>
                <p className="text-sm text-muted-foreground">{formatDate(e.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatCurrency(e.total)}</span>
                <EstimateStatusBadge status={e.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
