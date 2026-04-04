'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServiceOrders, useDeleteServiceOrder, type ServiceOrderFilters } from '@/hooks/use-service-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  waiting_parts: 'bg-yellow-100 text-yellow-800',
  waiting_approval: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  waiting_parts: 'Waiting Parts',
  waiting_approval: 'Waiting Approval',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function ServiceOrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ServiceOrderFilters>({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = useServiceOrders(filters);
  const deleteOrder = useDeleteServiceOrder();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((p) => ({ ...p, search: searchInput || undefined, page: 1 }));
  };

  const handleSort = (col: string) => {
    setFilters((p) => ({ ...p, sort_by: col, sort_order: p.sort_by === col && p.sort_order === 'asc' ? 'desc' : 'asc' }));
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Service Orders</h1>
        <Link href="/service-orders/new"><Button>+ New Order</Button></Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Search order number..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-64" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Select value={filters.status || ''} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))} className="w-48">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        {(filters.search || filters.status) && (
          <Button variant="ghost" onClick={() => { setSearchInput(''); setFilters({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' }); }}>Clear</Button>
        )}
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : error ? (
          <p className="p-8 text-center text-destructive">Failed to load: {error.message}</p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No service orders found</p>
            <p className="mt-1 text-sm">{filters.search || filters.status ? 'Try adjusting your filters.' : 'Create your first service order.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('order_number')}>
                    Order # {filters.sort_by === 'order_number' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="cursor-pointer px-4 py-3 text-right font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('total_amount')}>
                    Total {filters.sort_by === 'total_amount' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Est. Completion</th>
                  <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('created_at')}>
                    Created {filters.sort_by === 'created_at' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((so) => (
                  <tr key={so.id} className="cursor-pointer border-b transition-colors hover:bg-muted/30" onClick={() => router.push(`/service-orders/${so.id}`)}>
                    <td className="px-4 py-3 font-medium font-mono">{so.order_number}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-transparent', STATUS_COLORS[so.status] || STATUS_COLORS.pending)}>
                        {STATUS_LABELS[so.status] || so.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${parseFloat(so.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-muted-foreground">{so.estimated_completion ? formatDate(so.estimated_completion) : '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(so.created_at)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/service-orders/${so.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this order?')) deleteOrder.mutate(so.id); }}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: meta.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((p) => ({ ...p, page: meta.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
