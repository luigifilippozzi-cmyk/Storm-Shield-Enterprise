'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useInsuranceCompany,
  useUpdateInsuranceCompany,
  type CreateInsuranceCompanyInput,
} from '@/hooks/use-insurance';
import { InsuranceForm } from '@/components/insurance/insurance-form';
import { Button } from '@/components/ui/button';

export default function EditInsurancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: company, isLoading, error } = useInsuranceCompany(id);
  const updateInsurance = useUpdateInsuranceCompany(id);

  const handleSubmit = async (data: CreateInsuranceCompanyInput) => {
    await updateInsurance.mutateAsync(data);
    router.push(`/insurance/${id}`);
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
      <div>
        <Link
          href={`/insurance/${id}`}
          className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Company
        </Link>
        <h1 className="text-3xl font-bold">Edit: {company.name}</h1>
      </div>
      <InsuranceForm
        initialData={company}
        onSubmit={handleSubmit}
        isLoading={updateInsurance.isPending}
      />
    </div>
  );
}
