'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEstimates, useDeleteEstimate, type EstimateFilters } from '@/hooks/use-estimates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { EstimateStatusBadge, ESTIMATE_STATUS_CONFIG } from '@/components/estimates/estimate-status-badge';

export default function EstimatesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<EstimateFilters>({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = useEstimates(filters);
  const deleteEstimate = useDeleteEstimate();

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
        <h1 className="text-3xl font-bold">Estimates</h1>
        <Link href="/estimates/new"><Button>+ New Estimate</Button></Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Search estimate number..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-64" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Select value={filters.status || ''} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))} className="w-48">
          <option value="">All Statuses</option>
          {Object.entries(ESTIMATE_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        {(filters.search || filters.status) && (
          <Button variant="ghost" onClick={() => { setSearchInput(''); setFilters({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' }); }}>Clear</Button>
        )}
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Loading estimates" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-destructive" role="alert">Failed to load estimates: {error.message}</p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No estimates found</p>
            <p className="mt-1 text-sm">{filters.search || filters.status ? 'Try adjusting your filters.' : 'Create your first estimate to get started.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Estimates list">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('estimate_number')}>
                    Estimate # {filters.sort_by === 'estimate_number' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th scope="col" className="cursor-pointer px-4 py-3 text-right font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('total')}>
                    Total {filters.sort_by === 'total' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Claim #</th>
                  <th scope="col" className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('created_at')}>
                    Created {filters.sort_by === 'created_at' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((est) => (
                  <tr key={est.id} className="cursor-pointer border-b transition-colors hover:bg-muted/30" onClick={() => router.push(`/estimates/${est.id}`)}>
                    <td className="px-4 py-3 font-medium font-mono">{est.estimate_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(est as any).customer_name || '\u2014'}</td>
                    <td className="px-4 py-3">
                      <EstimateStatusBadge status={est.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">${parseFloat(est.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-muted-foreground">{est.claim_number || '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(est.created_at)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/estimates/${est.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this estimate?')) deleteEstimate.mutate(est.id); }}>Delete</Button>
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
