'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendDataPoint {
  month: string;
  income: string;
  expenses: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map((d) => ({
    month: d.month,
    Income: parseFloat(d.income),
    Expenses: parseFloat(d.expenses),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No financial data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
        <Tooltip formatter={(value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
