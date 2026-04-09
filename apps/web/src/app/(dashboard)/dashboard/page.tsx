'use client';

import Link from 'next/link';
import { useEstimates } from '@/hooks/use-estimates';
import { useServiceOrders } from '@/hooks/use-service-orders';
import { useFinancialSummary, useFinancialDashboard } from '@/hooks/use-financial';
import { useCustomers } from '@/hooks/use-customers';
import { TrendChart } from '@/components/financial/trend-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { cn } from '@/lib/utils';

function StatCard({ title, value, href, color }: { title: string; value: string; href: string; color?: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={cn('mt-2 text-2xl font-bold', color)}>{value}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: estimates } = useEstimates({ status: 'sent', limit: 1 });
  const { data: activeOrders } = useServiceOrders({ status: 'in_progress', limit: 1 });
  const { data: summary } = useFinancialSummary();
  const { data: customers } = useCustomers({ limit: 1 });
  const { data: dashboard } = useFinancialDashboard();

  const openEstimates = estimates?.meta?.total ?? '\u2014';
  const activeSOs = activeOrders?.meta?.total ?? '\u2014';
  const totalCustomers = customers?.meta?.total ?? '\u2014';

  // Monthly revenue: get current month from dashboard trend
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyIncome = dashboard?.monthly_trend?.find((m) => m.month === currentMonth);
  const revenue = monthlyIncome
    ? `$${parseFloat(monthlyIncome.income).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : summary?.total_income !== undefined
      ? `$${summary.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '\u2014';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={String(totalCustomers)} href="/customers" />
        <StatCard title="Open Estimates" value={String(openEstimates)} href="/estimates" color="text-blue-600" />
        <StatCard title="Active Service Orders" value={String(activeSOs)} href="/service-orders" color="text-orange-600" />
        <StatCard title="Monthly Revenue" value={String(revenue)} href="/financial" color="text-green-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <Link href="/customers/new" className="rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors">+ New Customer</Link>
            <Link href="/vehicles/new" className="rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors">+ New Vehicle</Link>
            <Link href="/estimates/new" className="rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors">+ New Estimate</Link>
            <Link href="/service-orders/new" className="rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors">+ New Service Order</Link>
          </div>
        </section>

        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Financial Overview</h2>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Income</span>
              <span className="font-medium text-green-600">
                {summary?.total_income !== undefined ? `$${summary.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-medium text-red-600">
                {summary?.total_expenses !== undefined ? `$${summary.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014'}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Balance</span>
                <span className={cn('text-lg font-bold', summary && summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {summary?.net_balance !== undefined ? `$${summary.net_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Financial Trend Chart */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Income vs Expenses (Last 12 Months)</h2>
        </div>
        <div className="p-4">
          <TrendChart data={dashboard?.monthly_trend || []} />
        </div>
      </section>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
