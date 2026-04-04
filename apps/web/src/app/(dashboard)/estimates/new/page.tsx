'use client';

import { useRouter } from 'next/navigation';
import { useCreateEstimate, type CreateEstimateInput } from '@/hooks/use-estimates';
import { EstimateForm } from '@/components/estimates/estimate-form';

export default function NewEstimatePage() {
  const router = useRouter();
  const createEstimate = useCreateEstimate();

  const handleSubmit = async (data: CreateEstimateInput) => {
    const estimate = await createEstimate.mutateAsync(data);
    router.push(`/estimates/${estimate.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">New Estimate</h1>
      <EstimateForm onSubmit={handleSubmit} isLoading={createEstimate.isPending} />
    </div>
  );
}
