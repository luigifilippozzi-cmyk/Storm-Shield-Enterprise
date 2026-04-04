'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServiceOrder, useUpdateServiceOrder, type CreateServiceOrderInput } from '@/hooks/use-service-orders';
import { ServiceOrderForm } from '@/components/service-orders/service-order-form';
import { Button } from '@/components/ui/button';

export default function EditServiceOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, error } = useServiceOrder(id);
  const update = useUpdateServiceOrder(id);

  const handleSubmit = async (data: CreateServiceOrderInput) => {
    await update.mutateAsync(data);
    router.push(`/service-orders/${id}`);
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (error || !order) return (
    <div className="space-y-4">
      <p className="text-destructive">{error ? `Failed to load: ${error.message}` : 'Not found'}</p>
      <Link href="/service-orders"><Button variant="outline">Back</Button></Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={`/service-orders/${id}`} className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Order</Link>
      <h1 className="text-3xl font-bold">Edit: Order {order.order_number}</h1>
      <ServiceOrderForm initialData={order} onSubmit={handleSubmit} isLoading={update.isPending} />
    </div>
  );
}
