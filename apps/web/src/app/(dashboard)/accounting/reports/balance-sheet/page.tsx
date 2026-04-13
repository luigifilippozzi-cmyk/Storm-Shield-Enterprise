'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBalanceSheet } from '@/hooks/use-accounting-reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function BalanceSection({ title, rows, total, className }: {
  title: string;
  rows: { account_number: string; account_name: string; balance: number }[];
  total: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border', className)}>
      <div className="border-b bg-muted/50 px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">No entries as of this date</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.account_number} className="border-b transition-colors hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{row.account_number}</td>
                <td className="px-4 py-2">{row.account_name}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(row.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={2} className="px-4 py-3 text-right">Total {title}</td>
              <td className="px-4 py-3 text-right font-mono">{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export default function BalanceSheetPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(today);
  const [submitted, setSubmitted] = useState(today);

  const { data, isLoading, error } = useBalanceSheet({ as_of_date: submitted });

  const isBalanced = data
    ? Math.abs(data.assets.total - data.total_liabilities_and_equity) < 0.01
    : true;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounting/reports" className="text-sm text-muted-foreground hover:text-foreground">
          ← Reports
        </Link>
        <h1 className="text-3xl font-bold">Balance Sheet</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="as_of_date">As of Date</Label>
          <Input
            id="as_of_date"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-48"
          />
        </div>
        <Button onClick={() => setSubmitted(asOfDate)} disabled={!asOfDate}>
          Run Report
        </Button>
      </div>

      {/* Report */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <p className="p-8 text-center text-destructive">Failed to load balance sheet. Please try again.</p>
      ) : data ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">As of {data.as_of_date}</p>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Assets */}
            <BalanceSection title="Assets" rows={data.assets.rows} total={data.assets.total} />

            {/* Right: Liabilities + Equity */}
            <div className="space-y-4">
              <BalanceSection title="Liabilities" rows={data.liabilities.rows} total={data.liabilities.total} />
              <BalanceSection title="Equity" rows={data.equity.rows} total={data.equity.total} />

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Liabilities &amp; Equity</span>
                  <span className="font-bold font-mono">{fmt(data.total_liabilities_and_equity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance check */}
          {!isBalanced && (
            <p className="text-sm font-medium text-destructive">
              Warning: Balance sheet does not balance — Assets: {fmt(data.assets.total)} vs. Liabilities + Equity: {fmt(data.total_liabilities_and_equity)}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
