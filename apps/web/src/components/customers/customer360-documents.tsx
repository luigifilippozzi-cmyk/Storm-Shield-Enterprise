'use client';

import { formatDate } from '@/lib/utils';
import { useEstimates } from '@/hooks/use-estimates';

export function Customer360Documents({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useEstimates({ customer_id: customerId, limit: 50 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load documents: {error.message}</p>;
  }

  const estimates = data?.data ?? [];

  if (estimates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No documents yet. Documents are attached to estimates and service orders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Documents are managed per estimate or service order. Navigate to each record to view or upload files.
      </p>
      <div className="divide-y rounded-lg border">
        {estimates.map((e) => (
          <a
            key={e.id}
            href={`/estimates/${e.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📄</span>
              <div>
                <p className="text-sm font-medium">{e.estimate_number}</p>
                <p className="text-xs text-muted-foreground">Estimate · {formatDate(e.created_at)}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">View →</span>
          </a>
        ))}
      </div>
    </div>
  );
}
