'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEstimate, useUpdateEstimate, type CreateEstimateInput } from '@/hooks/use-estimates';
import { EstimateForm } from '@/components/estimates/estimate-form';
import { Button } from '@/components/ui/button';

export default function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: estimate, isLoading, error } = useEstimate(id);
  const updateEstimate = useUpdateEstimate(id);

  const handleSubmit = async (data: CreateEstimateInput) => {
    await updateEstimate.mutateAsync(data);
    router.push(`/estimates/${id}`);
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (error || !estimate) return (
    <div className="space-y-4">
      <p className="text-destructive">{error ? `Failed to load: ${error.message}` : 'Estimate not found'}</p>
      <Link href="/estimates"><Button variant="outline">Back to Estimates</Button></Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/estimates/${id}`} className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Estimate</Link>
      <h1 className="text-3xl font-bold">Edit: Estimate {estimate.estimate_number}</h1>
      <EstimateForm initialData={estimate} onSubmit={handleSubmit} isLoading={updateEstimate.isPending} />
    </div>
  );
}
