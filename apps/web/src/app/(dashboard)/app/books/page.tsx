'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceInfo } from '@/hooks/use-workspace';
import { isWorkspaceAccessible } from '@/lib/workspace';
import { useFinancialSummary } from '@/hooks/use-financial';

export default function BooksPage() {
  const { data: workspace, isLoading } = useWorkspaceInfo();

  if (!isLoading && workspace && !isWorkspaceAccessible('books', workspace.roles)) {
    redirect('/403');
  }

  const { data: summary } = useFinancialSummary();

  const fmt = (n: number | null | undefined) =>
    `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Books</h1>
        <p className="mt-1 text-sm text-muted-foreground">Financial overview for the accountant</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{summary ? fmt(summary.total_income) : '—'}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{summary ? fmt(summary.total_expenses) : '—'}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Net Income</p>
          <p className="mt-2 text-2xl font-bold">{summary ? fmt(summary.net_balance) : '—'}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Financial', href: '/financial' },
          { label: 'Reports', href: '/accounting/reports' },
          { label: 'Journal Entries', href: '/accounting/journal-entries' },
          { label: 'Fixed Assets', href: '/accounting/fixed-assets' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border bg-card p-4 text-center text-sm font-medium hover:bg-accent"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
