'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProfitLoss } from '@/hooks/use-accounting-reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ReportSection({ title, rows, total, amountLabel = 'Amount' }: {
  title: string;
  rows: { account_number: string; account_name: string; amount: number }[];
  total: number;
  amountLabel?: string;
}) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/50 px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">No entries for this period</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Account #</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Account Name</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">{amountLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.account_number} className="border-b transition-colors hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{row.account_number}</td>
                <td className="px-4 py-2">{row.account_name}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(row.amount)}</td>
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

export default function ProfitLossPage() {
  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [submittedOpts, setSubmittedOpts] = useState({ date_from: `${currentYear}-01-01`, date_to: new Date().toISOString().slice(0, 10) });

  const { data, isLoading, error } = useProfitLoss(submittedOpts);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounting/reports" className="text-sm text-muted-foreground hover:text-foreground">
          ← Reports
        </Link>
        <h1 className="text-3xl font-bold">Profit &amp; Loss</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="date_from">From</Label>
          <Input
            id="date_from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date_to">To</Label>
          <Input
            id="date_to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-44"
          />
        </div>
        <Button onClick={() => setSubmittedOpts({ date_from: dateFrom, date_to: dateTo })}>
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
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Period: {data.date_from} — {data.date_to}
          </p>
          <ReportSection title="Revenue" rows={data.revenue.rows} total={data.revenue.total} />
          <ReportSection title="Expenses" rows={data.expenses.rows} total={data.expenses.total} />

          {/* Net Income */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Net Income</span>
              <span className={cn('text-xl font-bold', data.net_income >= 0 ? 'text-green-600' : 'text-destructive')}>
                {data.net_income < 0 ? '-' : ''}${fmt(Math.abs(data.net_income))}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
