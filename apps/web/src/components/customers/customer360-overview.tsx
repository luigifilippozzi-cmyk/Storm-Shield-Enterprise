'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatPhone, formatDate } from '@/lib/utils';
import { useCustomerSummary } from '@/hooks/use-customers';
import type { Customer } from '@sse/shared-types';

const SOURCE_COLORS: Record<string, string> = {
  insurance: 'bg-blue-100 text-blue-800',
  walk_in: 'bg-green-100 text-green-800',
  referral: 'bg-purple-100 text-purple-800',
  website: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function Customer360Overview({ customer }: { customer: Customer }) {
  const { data: summary, isLoading } = useCustomerSummary(customer.id);

  const address = [customer.address, customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ');

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="space-y-6">
      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Open Estimates"
          value={isLoading ? '—' : (summary?.open_estimates_count ?? 0)}
        />
        <MetricCard
          label="Open Service Orders"
          value={isLoading ? '—' : (summary?.open_so_count ?? 0)}
        />
        <MetricCard
          label="Balance"
          value={isLoading ? '—' : formatCurrency(summary?.balance ?? 0)}
        />
        <MetricCard
          label="YTD Revenue"
          value={isLoading ? '—' : formatCurrency(summary?.ytd_revenue ?? 0)}
        />
      </div>

      {/* Contact + Insurance */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Contact</h3>
          </div>
          <dl className="divide-y px-4">
            {customer.phone && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="col-span-2 text-sm">{formatPhone(customer.phone)}</dd>
              </div>
            )}
            {customer.phone_secondary && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm text-muted-foreground">Alt Phone</dt>
                <dd className="col-span-2 text-sm">{formatPhone(customer.phone_secondary)}</dd>
              </div>
            )}
            {customer.email && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="col-span-2 text-sm">{customer.email}</dd>
              </div>
            )}
            {address && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm text-muted-foreground">Address</dt>
                <dd className="col-span-2 text-sm">{address}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Profile</h3>
          </div>
          <dl className="divide-y px-4">
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm text-muted-foreground">Type</dt>
              <dd className="col-span-2">
                <Badge variant="outline" className="capitalize">{customer.type}</Badge>
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm text-muted-foreground">Source</dt>
              <dd className="col-span-2">
                <Badge className={cn('border-transparent capitalize', SOURCE_COLORS[customer.source] ?? SOURCE_COLORS.other)}>
                  {customer.source?.replace('_', ' ')}
                </Badge>
              </dd>
            </div>
            {customer.policy_number && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm text-muted-foreground">Policy #</dt>
                <dd className="col-span-2 text-sm">{customer.policy_number}</dd>
              </div>
            )}
            {summary?.last_activity_at && (
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm text-muted-foreground">Last Activity</dt>
                <dd className="col-span-2 text-sm">{formatDate(summary.last_activity_at)}</dd>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 py-3">
              <dt className="text-sm text-muted-foreground">Customer since</dt>
              <dd className="col-span-2 text-sm">{formatDate(customer.created_at)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Notes */}
      {customer.notes && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">Notes</h3>
          </div>
          <div className="px-4 py-3 text-sm whitespace-pre-wrap">{customer.notes}</div>
        </section>
      )}
    </div>
  );
}
