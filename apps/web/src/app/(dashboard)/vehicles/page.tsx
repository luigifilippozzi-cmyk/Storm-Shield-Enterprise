'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicles, useDeleteVehicle, type VehicleFilters } from '@/hooks/use-vehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
};

const SORTABLE_COLUMNS = [
  { key: 'year', label: 'Year' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'created_at', label: 'Created' },
  { key: 'mileage', label: 'Mileage' },
] as const;

export default function VehiclesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<VehicleFilters>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useVehicles(filters);
  const deleteVehicle = useDeleteVehicle();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDelete = async (id: string, vehicleLabel: string) => {
    if (!confirm(`Are you sure you want to delete ${vehicleLabel}?`)) return;
    deleteVehicle.mutate(id);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <Link href="/vehicles/new">
          <Button>+ Add Vehicle</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search VIN, make, model, plate..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Select
          value={filters.condition || ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, condition: e.target.value || undefined, page: 1 }))
          }
          className="w-40"
        >
          <option value="">All Conditions</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </Select>

        {(filters.search || filters.condition) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setFilters({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' });
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-destructive">
            Failed to load vehicles: {error.message}
          </p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No vehicles found</p>
            <p className="mt-1 text-sm">
              {filters.search || filters.condition
                ? 'Try adjusting your filters.'
                : 'Get started by adding your first vehicle.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {SORTABLE_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {filters.sort_by === col.key && (
                          <span>{filters.sort_order === 'asc' ? '\u2191' : '\u2193'}</span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">VIN</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Color</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Condition
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    License Plate
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{vehicle.year}</td>
                    <td className="px-4 py-3 font-medium">{vehicle.make}</td>
                    <td className="px-4 py-3 font-medium">{vehicle.model}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(vehicle.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {vehicle.mileage ? vehicle.mileage.toLocaleString() : '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{(vehicle as any).customer_name || '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{vehicle.vin || '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{vehicle.color || '\u2014'}</td>
                    <td className="px-4 py-3">
                      {vehicle.condition ? (
                        <Badge
                          className={cn(
                            'border-transparent',
                            CONDITION_COLORS[vehicle.condition] || CONDITION_COLORS.good,
                          )}
                        >
                          {CONDITION_LABELS[vehicle.condition] || vehicle.condition}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {vehicle.license_plate || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/vehicles/${vehicle.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDelete(vehicle.id, `${vehicle.year} ${vehicle.make} ${vehicle.model}`)
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} vehicles
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: meta.page - 1 }))}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4));
              const page = start + i;
              if (page > meta.totalPages) return null;
              return (
                <Button
                  key={page}
                  variant={page === meta.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, page }))}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: meta.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
