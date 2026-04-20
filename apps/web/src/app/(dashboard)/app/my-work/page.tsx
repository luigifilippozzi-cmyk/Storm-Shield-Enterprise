'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import { isWorkspaceAccessible } from '@/lib/workspace';
import { useServiceOrders } from '@/hooks/use-service-orders';

export default function MyWorkPage() {
  const { data: workspace, isLoading } = useWorkspaceInfo();

  if (!isLoading && workspace && !isWorkspaceAccessible('my-work', workspace.roles)) {
    redirect('/403');
  }

  const { data: inProgress } = useServiceOrders({ status: 'in_progress', limit: 10 });
  const { data: assigned } = useServiceOrders({ limit: 5 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Work</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your active service orders</p>
      </div>

      {inProgress && inProgress.data.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">In Progress ({inProgress.meta.total})</h2>
          <div className="space-y-2">
            {inProgress.data.map((so: any) => (
              <Link
                key={so.id}
                href={`/service-orders/${so.id}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{so.title || `SO #${so.id.slice(0, 8)}`}</p>
                  <p className="text-sm text-muted-foreground">{so.vehicle_info ?? '—'}</p>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  in progress
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No active service orders. Check with your manager for assignments.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/service-orders"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          All Orders
        </Link>
      </div>
    </div>
  );
}
