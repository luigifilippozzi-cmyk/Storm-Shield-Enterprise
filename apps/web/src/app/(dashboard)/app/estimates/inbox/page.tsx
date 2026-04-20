'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import { isWorkspaceAccessible } from '@/lib/workspace';
import { useEstimates } from '@/hooks/use-estimates';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
};

export default function EstimatesInboxPage() {
  const { data: workspace, isLoading } = useWorkspaceInfo();

  if (!isLoading && workspace && !isWorkspaceAccessible('estimates-inbox', workspace.roles)) {
    redirect('/403');
  }

  const { data: sent } = useEstimates({ status: 'sent', limit: 10 });
  const { data: draft } = useEstimates({ status: 'draft', limit: 5 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimates Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pending estimates awaiting action</p>
        </div>
        <Link
          href="/estimates/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New Estimate
        </Link>
      </div>

      {sent && sent.data.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Awaiting Response ({sent.meta.total})</h2>
          <div className="space-y-2">
            {sent.data.map((est: any) => (
              <Link
                key={est.id}
                href={`/estimates/${est.id}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{est.title || `Estimate #${est.id.slice(0, 8)}`}</p>
                  <p className="text-sm text-muted-foreground">{est.customer_name ?? '—'}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[est.status] ?? 'bg-muted'}`}
                >
                  {est.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {draft && draft.data.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Drafts ({draft.meta.total})</h2>
          <div className="space-y-2">
            {draft.data.map((est: any) => (
              <Link
                key={est.id}
                href={`/estimates/${est.id}/edit`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent"
              >
                <p className="font-medium">{est.title || `Draft #${est.id.slice(0, 8)}`}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  draft
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(!sent || sent.data.length === 0) && (!draft || draft.data.length === 0) && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No estimates pending. Create a new one to get started.</p>
        </div>
      )}
    </div>
  );
}
