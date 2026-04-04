'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomers, useDeleteCustomer, type CustomerFilters } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatPhone, formatDate } from '@/lib/utils';

const SOURCE_LABELS: Record<string, string> = {
  insurance: 'Insurance',
  walk_in: 'Walk-in',
  referral: 'Referral',
  website: 'Website',
  other: 'Other',
};

const SOURCE_COLORS: Record<string, string> = {
  insurance: 'bg-blue-100 text-blue-800',
  walk_in: 'bg-green-100 text-green-800',
  referral: 'bg-purple-100 text-purple-800',
  website: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

const SORTABLE_COLUMNS = [
  { key: 'first_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'created_at', label: 'Created' },
] as const;

export default function CustomersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useCustomers(filters);
  const deleteCustomer = useDeleteCustomer();

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    deleteCustomer.mutate(id);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Link href="/customers/new">
          <Button>+ Add Customer</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search name, email, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Select
          value={filters.type || ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value || undefined, page: 1 }))
          }
          className="w-40"
        >
          <option value="">All Types</option>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </Select>

        <Select
          value={filters.source || ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, source: e.target.value || undefined, page: 1 }))
          }
          className="w-40"
        >
          <option value="">All Sources</option>
          <option value="insurance">Insurance</option>
          <option value="walk_in">Walk-in</option>
          <option value="referral">Referral</option>
          <option value="website">Website</option>
          <option value="other">Other</option>
        </Select>

        {(filters.search || filters.type || filters.source) && (
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
            Failed to load customers: {error.message}
          </p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No customers found</p>
            <p className="mt-1 text-sm">
              {filters.search || filters.type || filters.source
                ? 'Try adjusting your filters.'
                : 'Get started by adding your first customer.'}
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {customer.first_name} {customer.last_name}
                      {customer.company_name && (
                        <span className="block text-xs text-muted-foreground">
                          {customer.company_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.email || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPhone(customer.phone)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {customer.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          'border-transparent',
                          SOURCE_COLORS[customer.source] || SOURCE_COLORS.other,
                        )}
                      >
                        {SOURCE_LABELS[customer.source] || customer.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/customers/${customer.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDelete(customer.id, `${customer.first_name} ${customer.last_name}`)
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
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} customers
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
