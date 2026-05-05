'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  subscription_plan: string;
  owner_email: string;
  wizard_status: string;
  wizard_completed_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

function usePlatformTenants() {
  const { getToken } = useAuth();
  return useQuery<Tenant[]>({
    queryKey: ['platform-admin', 'tenants'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/tenants/platform-admin/tenants', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error('Access denied. This area is restricted to the Platform Operator.');
      }
      if (!res.ok) {
        throw new Error(`Backend unreachable or misconfigured (HTTP ${res.status}). Check API connectivity.`);
      }
      return res.json().catch(() => {
        throw new Error('Server returned an unexpected response format. Check API connectivity.');
      });
    },
    retry: false,
  });
}

interface ProvisionForm {
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin';
  externalAuthId: string;
}

function useProvisionAdmin(tenantId: string) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProvisionForm) => {
      const token = await getToken();
      const res = await fetch(`/api/tenants/platform-admin/tenants/${tenantId}/admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Provisioning failed');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-admin', 'tenants'] }),
  });
}

function ProvisionDialog({ tenantId, tenantName, onClose }: { tenantId: string; tenantName: string; onClose: () => void }) {
  const [form, setForm] = useState<ProvisionForm>({ email: '', firstName: '', lastName: '', role: 'owner', externalAuthId: '' });
  const provision = useProvisionAdmin(tenantId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, externalAuthId: form.externalAuthId || undefined };
    provision.mutate(payload as ProvisionForm, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label={`Provision admin for ${tenantName}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Provision Admin — {tenantName}</h2>
        {provision.isError && (
          <div className="text-red-600 text-sm mb-3">{(provision.error as Error).message}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} aria-label="Email" />
          <Input required placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} aria-label="First name" />
          <Input required placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} aria-label="Last name" />
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as 'owner' | 'admin' }))}
            aria-label="Role"
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
          </select>
          <Input placeholder="Clerk user ID (optional)" value={form.externalAuthId} onChange={e => setForm(f => ({ ...f, externalAuthId: e.target.value }))} aria-label="Clerk user ID" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={provision.isPending}>
              {provision.isPending ? 'Provisioning…' : 'Provision'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlatformAdminPage() {
  const { data: tenants, isLoading, isError, error } = usePlatformTenants();
  const [search, setSearch] = useState('');
  const [provisioningTenant, setProvisioningTenant] = useState<Tenant | null>(null);

  const filtered = (tenants ?? []).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.owner_email.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-80 mb-4" />
        <div className="rounded-lg border overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const isAuthError = error instanceof Error && error.message.startsWith('Access denied');
    return (
      <div className="p-8">
        <div
          className={`border rounded-lg p-4 ${
            isAuthError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}
        >
          <strong>{isAuthError ? 'Access denied.' : 'Connection error.'}</strong>{' '}
          {isAuthError
            ? 'This area is restricted to the Platform Operator.'
            : 'Platform Admin could not reach the backend. Check API connectivity and try again.'}
          {error instanceof Error && <p className="text-sm mt-1 opacity-75">{error.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenants?.length ?? 0} tenants · Super User access · All actions are audited
        </p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by name, email or slug…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
          aria-label="Search tenants"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tenant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Wizard</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Owner Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50 motion-safe:transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-xs text-gray-400">{tenant.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[tenant.status] ?? 'bg-gray-100 text-gray-700'}>
                    {tenant.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{tenant.subscription_plan}</td>
                <td className="px-4 py-3">
                  <span className={tenant.wizard_status === 'completed' ? 'text-green-600' : 'text-gray-400'}>
                    {tenant.wizard_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{tenant.owner_email}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(tenant.created_at)}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProvisioningTenant(tenant)}
                  >
                    Provision Admin
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No tenants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {provisioningTenant && (
        <ProvisionDialog
          tenantId={provisioningTenant.id}
          tenantName={provisioningTenant.name}
          onClose={() => setProvisioningTenant(null)}
        />
      )}
    </div>
  );
}
