'use client';

interface CategoryItem {
  category: string;
  total: string;
}

interface CategoryBreakdownProps {
  /** Data array with category name and total amount string */
  items: CategoryItem[];
  /** Color theme for the bars — green for income, red for expense */
  color: 'green' | 'red';
  /** Accessible list label (must be unique per page) */
  listLabel: string;
  /** Label shown when there are no items */
  emptyLabel?: string;
}

/**
 * B3-4 — Financial breakdown por categoria.
 * Displays a horizontal bar list proportional to share of total.
 * No recharts dependency — pure Tailwind for a11y + mobile (PUX6).
 */
export function CategoryBreakdown({ items, color, listLabel, emptyLabel = 'No data' }: CategoryBreakdownProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{emptyLabel}</p>;
  }

  const totals = items.map((i) => parseFloat(i.total) || 0);
  const max = Math.max(...totals, 1);

  const barClass = color === 'green' ? 'bg-green-500' : 'bg-red-500';
  const textClass = color === 'green' ? 'text-green-700' : 'text-red-700';

  return (
    <ul className="space-y-2" aria-label={listLabel}>
      {items.map((item) => {
        const amount = parseFloat(item.total) || 0;
        const pct = Math.round((amount / max) * 100);
        const fmt = `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return (
          <li key={item.category} className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium capitalize truncate max-w-[60%]">{item.category || 'Uncategorized'}</span>
              <span className={`font-semibold ${textClass}`}>{fmt}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.category}: ${fmt}`}>
              <div
                className={`h-full rounded-full motion-safe:transition-all ${barClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
