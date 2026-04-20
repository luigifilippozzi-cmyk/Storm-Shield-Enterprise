'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import { isWorkspaceAccessible } from '@/lib/workspace';
import { useCustomers } from '@/hooks/use-customers';
import { useEstimates } from '@/hooks/use-estimates';
import { useServiceOrders } from '@/hooks/use-service-orders';
import { useFinancialSummary } from '@/hooks/use-financial';

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function CockpitPage() {
  const { data: workspace, isLoading } = useWorkspaceInfo();

  if (!isLoading && workspace && !isWorkspaceAccessible('cockpit', workspace.roles)) {
    redirect('/403');
  }

  const { data: customers } = useCustomers({ limit: 1 });
  const { data: estimates } = useEstimates({ status: 'sent', limit: 1 });
  const { data: orders } = useServiceOrders({ status: 'in_progress', limit: 1 });
  const { data: summary } = useFinancialSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cockpit</h1>
        <p className="mt-1 text-sm text-muted-foreground">Owner overview — key metrics at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={customers?.meta?.total ?? '—'} />
        <StatCard title="Open Estimates" value={estimates?.meta?.total ?? '—'} sub="status: sent" />
        <StatCard title="Active Work Orders" value={orders?.meta?.total ?? '—'} sub="in progress" />
        <StatCard
          title="Revenue (MTD)"
          value={
            summary
              ? `$${Number(summary.total_income ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'
          }
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Quick links: manage customers, review estimates, track financials — all from the sidebar.
        </p>
      </div>
    </div>
  );
}
