'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useInsuranceCompanies,
  useDeleteInsuranceCompany,
  type InsuranceCompanyFilters,
} from '@/hooks/use-insurance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

const SORTABLE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'payment_terms_days', label: 'Payment Terms' },
  { key: 'created_at', label: 'Created' },
] as const;

export default function InsurancePage() {
  const router = useRouter();
  const [filters, setFilters] = useState<InsuranceCompanyFilters>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useInsuranceCompanies(filters);
  const deleteInsurance = useDeleteInsuranceCompany();

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

  const handleDelete = async (id: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete ${companyName}?`)) return;
    deleteInsurance.mutate(id);
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insurance Companies</h1>
        <Link href="/insurance/new">
          <Button>+ Add Company</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search name, code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Select
          value={filters.is_drp === undefined ? '' : String(filters.is_drp)}
          onChange={(e) => {
            const value = e.target.value;
            setFilters((prev) => ({
              ...prev,
              is_drp: value === '' ? undefined : value === 'true',
              page: 1,
            }));
          }}
          className="w-40"
        >
          <option value="">All Companies</option>
          <option value="true">DRP Only</option>
          <option value="false">Non-DRP</option>
        </Select>

        {(filters.search || filters.is_drp !== undefined) && (
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
            Failed to load insurance companies: {error.message}
          </p>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium">No insurance companies found</p>
            <p className="mt-1 text-sm">
              {filters.search || filters.is_drp !== undefined
                ? 'Try adjusting your filters.'
                : 'Get started by adding your first insurance company.'}
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">DRP</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((company) => (
                  <tr
                    key={company.id}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/insurance/${company.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{company.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{company.code || '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {company.payment_terms_days ? `${company.payment_terms_days} days` : '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(company.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {company.is_drp ? (
                        <Badge className="border-transparent bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge className="border-transparent bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{company.phone || '\u2014'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{company.email || '\u2014'}</td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/insurance/${company.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(company.id, company.name)}
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
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} companies
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
