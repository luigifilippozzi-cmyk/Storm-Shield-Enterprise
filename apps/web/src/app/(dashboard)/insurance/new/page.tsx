'use client';

import { useRouter } from 'next/navigation';
import { useCreateInsuranceCompany, type CreateInsuranceCompanyInput } from '@/hooks/use-insurance';
import { InsuranceForm } from '@/components/insurance/insurance-form';

export default function NewInsurancePage() {
  const router = useRouter();
  const createInsurance = useCreateInsuranceCompany();

  const handleSubmit = async (data: CreateInsuranceCompanyInput) => {
    const company = await createInsurance.mutateAsync(data);
    router.push(`/insurance/${company.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">New Insurance Company</h1>
      <InsuranceForm onSubmit={handleSubmit} isLoading={createInsurance.isPending} />
    </div>
  );
}
