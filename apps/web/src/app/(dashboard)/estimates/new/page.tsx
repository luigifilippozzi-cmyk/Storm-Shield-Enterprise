'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateEstimate, type CreateEstimateInput } from '@/hooks/use-estimates';
import { EstimateForm } from '@/components/estimates/estimate-form';

function NewEstimateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id') ?? undefined;
  const createEstimate = useCreateEstimate();

  const handleSubmit = async (data: CreateEstimateInput) => {
    const estimate = await createEstimate.mutateAsync(data);
    router.push(`/estimates/${estimate.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">New Estimate</h1>
      <EstimateForm
        initialData={customerId ? ({ customer_id: customerId } as any) : undefined}
        onSubmit={handleSubmit}
        isLoading={createEstimate.isPending}
      />
    </div>
  );
}

export default function NewEstimatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <NewEstimateContent />
    </Suspense>
  );
}
