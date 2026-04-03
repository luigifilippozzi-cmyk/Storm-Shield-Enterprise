export default function FinancialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          New Transaction
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Total Income', value: '—' },
          { title: 'Total Expenses', value: '—' },
          { title: 'Net Balance', value: '—' },
        ].map((card) => (
          <div key={card.title} className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
