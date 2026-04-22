'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateVehicle, type CreateVehicleInput } from '@/hooks/use-vehicles';
import { VehicleForm } from '@/components/vehicles/vehicle-form';

function NewVehicleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id') ?? undefined;
  const createVehicle = useCreateVehicle();

  const handleSubmit = async (data: CreateVehicleInput) => {
    const vehicle = await createVehicle.mutateAsync(data);
    router.push(`/vehicles/${vehicle.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">New Vehicle</h1>
      <VehicleForm
        initialData={customerId ? ({ customer_id: customerId } as any) : undefined}
        onSubmit={handleSubmit}
        isLoading={createVehicle.isPending}
      />
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <NewVehicleContent />
    </Suspense>
  );
}
