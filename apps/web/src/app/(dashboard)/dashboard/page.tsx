export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Open Estimates', value: '—' },
          { title: 'Active Service Orders', value: '—' },
          { title: 'Pending Payments', value: '—' },
          { title: 'Monthly Revenue', value: '—' },
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
