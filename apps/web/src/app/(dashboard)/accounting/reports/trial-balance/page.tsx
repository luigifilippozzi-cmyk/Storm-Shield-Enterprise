'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTrialBalance } from '@/hooks/use-accounting-reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  asset: 'text-blue-700',
  liability: 'text-orange-700',
  equity: 'text-purple-700',
  revenue: 'text-green-700',
  expense: 'text-red-700',
};

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TrialBalancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(today);
  const [submitted, setSubmitted] = useState(today);

  const { data, isLoading, error } = useTrialBalance({ as_of_date: submitted });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounting/reports" className="text-sm text-muted-foreground hover:text-foreground">
          ← Reports
        </Link>
        <h1 className="text-3xl font-bold">Trial Balance</h1>
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
        <p className="p-8 text-center text-destructive">Failed to load report. Please try again.</p>
      ) : data ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">As of {data.as_of_date}</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account #</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Debits</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Credits</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.account_number} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{row.account_number}</td>
                    <td className="px-4 py-2">{row.account_name}</td>
                    <td className={cn('px-4 py-2 capitalize', TYPE_COLORS[row.account_type] || '')}>{row.account_type}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(row.total_debits)}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(row.total_credits)}</td>
                    <td className={cn('px-4 py-2 text-right font-mono font-medium', row.balance < 0 ? 'text-destructive' : '')}>
                      {fmt(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-right">Totals</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(data.total_debits)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(data.total_credits)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          {data.total_debits !== data.total_credits && (
            <p className="text-sm font-medium text-destructive">
              Warning: Debits and credits do not balance (difference: {fmt(Math.abs(data.total_debits - data.total_credits))})
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
