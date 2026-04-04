'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicles, useDeleteVehicle, type VehicleFilters } from '@/hooks/use-vehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function VehiclesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<VehicleFilters>({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = useVehicles(filters);
  const deleteVehicle = useDeleteVehicle();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((p) => ({ ...p, search: searchInput || undefined, page: 1 }));
  };

  const handleSort = (col: string) => {
    setFilters((p) => ({ ...p, sort_by: col, sort_order: p.sort_by === col && p.sort_order === 'asc' ? 'desc' : 'asc' }));
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete ${label}?`)) return;
    deleteVehicle.mutate(id);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <Link href="/vehicles/new"><Button>+ Add Vehicle</Button></Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Search make, model, VIN..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-64" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        {filters.search && (
          <Button variant="ghost" onClick={() => { setSearchInput(''); setFilters({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' }); }}>Clear</Button>
        )}
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-destructive">Failed to load vehicles: {error.message}</p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No vehicles found</p>
            <p className="mt-1 text-sm">{filters.search ? 'Try adjusting your search.' : 'Add your first vehicle to get started.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('year')}>
                    Year/Make/Model {filters.sort_by === 'year' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">VIN</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Color</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condition</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plate</th>
                  <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort('created_at')}>
                    Added {filters.sort_by === 'created_at' && (filters.sort_order === 'asc' ? '\u2191' : '\u2193')}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((v) => (
                  <tr key={v.id} className="cursor-pointer border-b transition-colors hover:bg-muted/30" onClick={() => router.push(`/vehicles/${v.id}`)}>
                    <td className="px-4 py-3 font-medium">
                      {v.year} {v.make} {v.model}
                      {v.trim && <span className="text-muted-foreground"> {v.trim}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.vin || '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.color || '\u2014'}</td>
                    <td className="px-4 py-3">
                      {v.condition ? <Badge variant="outline" className="capitalize">{v.condition}</Badge> : '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.license_plate ? `${v.license_plate}${v.license_state ? ` (${v.license_state})` : ''}` : '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(v.created_at)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/vehicles/${v.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(v.id, `${v.year} ${v.make} ${v.model}`)}>Delete</Button>
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
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: meta.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((p) => ({ ...p, page: meta.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
