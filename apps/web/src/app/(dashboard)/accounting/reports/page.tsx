import Link from 'next/link';

const REPORTS = [
  {
    href: '/accounting/reports/trial-balance',
    title: 'Trial Balance',
    description: 'All accounts with debit/credit totals and net balance as of any date.',
  },
  {
    href: '/accounting/reports/profit-loss',
    title: 'Profit & Loss',
    description: 'Revenue vs. expenses for any date range or fiscal period.',
  },
  {
    href: '/accounting/reports/balance-sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity as of any date.',
  },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Accounting Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href} className="block rounded-lg border bg-card p-6 transition-colors hover:border-primary hover:bg-accent">
            <h2 className="text-lg font-semibold">{r.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
