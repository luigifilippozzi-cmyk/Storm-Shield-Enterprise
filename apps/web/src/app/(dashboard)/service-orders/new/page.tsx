'use client';

import { useRouter } from 'next/navigation';
import { useCreateServiceOrder, type CreateServiceOrderInput } from '@/hooks/use-service-orders';
import { ServiceOrderForm } from '@/components/service-orders/service-order-form';

export default function NewServiceOrderPage() {
  const router = useRouter();
  const create = useCreateServiceOrder();

  const handleSubmit = async (data: CreateServiceOrderInput) => {
    const order = await create.mutateAsync(data);
    router.push(`/service-orders/${order.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">New Service Order</h1>
      <ServiceOrderForm onSubmit={handleSubmit} isLoading={create.isPending} />
    </div>
  );
}
