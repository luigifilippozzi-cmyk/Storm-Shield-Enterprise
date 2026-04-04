'use client';

import { useRouter } from 'next/navigation';
import { useCreateCustomer, type CreateCustomerInput } from '@/hooks/use-customers';
import { CustomerForm } from '@/components/customers/customer-form';

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const handleSubmit = async (data: CreateCustomerInput) => {
    const customer = await createCustomer.mutateAsync(data);
    router.push(`/customers/${customer.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">New Customer</h1>
      <CustomerForm onSubmit={handleSubmit} isLoading={createCustomer.isPending} />
    </div>
  );
}
