'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer, useDeleteCustomer } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: customer, isLoading, error } = useCustomer(id);
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    if (!customer) return;
    if (!confirm(`Are you sure you want to delete ${customer.first_name} ${customer.last_name}?`)) return;
    await deleteCustomer.mutateAsync(customer.id);
    router.push('/customers');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error ? `Failed to load customer: ${error.message}` : 'Customer not found'}
        </p>
        <Link href="/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const address = [customer.address, customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/customers"
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Customers
          </Link>
          <h1 className="text-3xl font-bold">
            {customer.first_name} {customer.last_name}
          </h1>
          {customer.company_name && (
            <p className="text-muted-foreground">{customer.company_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        <Badge variant="outline" className="capitalize">
          {customer.type}
        </Badge>
        <Badge
          className={cn(
            'border-transparent',
            SOURCE_COLORS[customer.source] || SOURCE_COLORS.other,
          )}
        >
          {SOURCE_LABELS[customer.source] || customer.source}
        </Badge>
      </div>

      {/* Contact */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Contact Information</h2>
        </div>
        <dl className="px-4">
          <DetailRow label="Phone" value={formatPhone(customer.phone)} />
          {customer.phone_secondary && (
            <DetailRow label="Secondary Phone" value={formatPhone(customer.phone_secondary)} />
          )}
          <DetailRow label="Email" value={customer.email} />
          <DetailRow label="Address" value={address || null} />
        </dl>
      </section>

      {/* Insurance */}
      {customer.policy_number && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Insurance</h2>
          </div>
          <dl className="px-4">
            <DetailRow label="Policy Number" value={customer.policy_number} />
          </dl>
        </section>
      )}

      {/* Notes */}
      {customer.notes && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Notes</h2>
          </div>
          <div className="px-4 py-3 text-sm whitespace-pre-wrap">{customer.notes}</div>
        </section>
      )}

      {/* Meta */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Record Info</h2>
        </div>
        <dl className="px-4">
          <DetailRow label="Created" value={formatDate(customer.created_at)} />
          <DetailRow label="Last Updated" value={formatDate(customer.updated_at)} />
          <DetailRow label="ID" value={<code className="text-xs">{customer.id}</code>} />
        </dl>
      </section>
    </div>
  );
}
