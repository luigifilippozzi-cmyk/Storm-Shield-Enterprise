'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomer, useUpdateCustomer, type CreateCustomerInput } from '@/hooks/use-customers';
import { CustomerForm } from '@/components/customers/customer-form';
import { Button } from '@/components/ui/button';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: customer, isLoading, error } = useCustomer(id);
  const updateCustomer = useUpdateCustomer(id);

  const handleSubmit = async (data: CreateCustomerInput) => {
    await updateCustomer.mutateAsync(data);
    router.push(`/customers/${id}`);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/customers/${id}`}
          className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Customer
        </Link>
        <h1 className="text-3xl font-bold">
          Edit: {customer.first_name} {customer.last_name}
        </h1>
      </div>
      <CustomerForm
        initialData={customer}
        onSubmit={handleSubmit}
        isLoading={updateCustomer.isPending}
      />
    </div>
  );
}
