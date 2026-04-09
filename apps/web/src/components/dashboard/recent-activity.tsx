'use client';

import Link from 'next/link';
import { useCustomers } from '@/hooks/use-customers';
import { useTransactions } from '@/hooks/use-financial';
import { formatDate } from '@/lib/utils';

export function RecentActivity() {
  const { data: customersData } = useCustomers({ limit: 5, sort_by: 'created_at', sort_order: 'desc' });
  const { data: txData } = useTransactions({ limit: 5, sort_by: 'created_at', sort_order: 'desc' });

  const customers = customersData?.data || [];
  const transactions = txData?.data || [];

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Recent Activity</h2>
      </div>
      <div className="divide-y">
        {customers.length === 0 && transactions.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No recent activity</p>
        )}
        {customers.map((c) => (
          <Link key={`c-${c.id}`} href={`/customers/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">{c.first_name} {c.last_name}</p>
              <p className="text-xs text-muted-foreground">New customer</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
          </Link>
        ))}
        {transactions.map((t) => (
          <Link key={`t-${t.id}`} href={`/financial/${t.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">{t.description}</p>
              <p className="text-xs text-muted-foreground capitalize">{t.transaction_type} &mdash; ${parseFloat(String(t.amount)).toFixed(2)}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(t.created_at)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
