'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInsuranceCompany, useDeleteInsuranceCompany } from '@/hooks/use-insurance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function InsuranceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: company, isLoading, error } = useInsuranceCompany(id);
  const deleteInsurance = useDeleteInsuranceCompany();

  const handleDelete = async () => {
    if (!company) return;
    if (!confirm(`Are you sure you want to delete ${company.name}?`)) return;
    await deleteInsurance.mutateAsync(company.id);
    router.push('/insurance');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">
          {error ? `Failed to load insurance company: ${error.message}` : 'Company not found'}
        </p>
        <Link href="/insurance">
          <Button variant="outline">Back to Insurance</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/insurance"
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Insurance
          </Link>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          {company.code && <p className="text-muted-foreground">{company.code}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/insurance/${company.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* DRP Badge */}
      {company.is_drp && (
        <div>
          <Badge className="border-transparent bg-green-100 text-green-800">
            Direct Repair Program
          </Badge>
        </div>
      )}

      {/* Company Info */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Company Information</h2>
        </div>
        <dl className="px-4">
          <DetailRow label="Code" value={company.code} />
          <DetailRow label="DRP" value={company.is_drp ? 'Yes' : 'No'} />
          <DetailRow
            label="Payment Terms"
            value={company.payment_terms_days ? `${company.payment_terms_days} days` : null}
          />
        </dl>
      </section>

      {/* Contact Info */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Contact Information</h2>
        </div>
        <dl className="px-4">
          <DetailRow label="Phone" value={company.phone} />
          <DetailRow label="Email" value={company.email} />
          <DetailRow label="Address" value={company.address} />
        </dl>
      </section>

      {/* Notes */}
      {company.notes && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Notes</h2>
          </div>
          <div className="px-4 py-3 text-sm whitespace-pre-wrap">{company.notes}</div>
        </section>
      )}

      {/* Meta */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Record Info</h2>
        </div>
        <dl className="px-4">
          <DetailRow label="Created" value={formatDate(company.created_at)} />
          <DetailRow label="Last Updated" value={formatDate(company.updated_at)} />
          <DetailRow label="ID" value={<code className="text-xs">{company.id}</code>} />
        </dl>
      </section>
    </div>
  );
}
