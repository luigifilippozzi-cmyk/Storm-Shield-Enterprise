'use client';

import { useRouter } from 'next/navigation';
import { useCreateVehicle, type CreateVehicleInput } from '@/hooks/use-vehicles';
import { VehicleForm } from '@/components/vehicles/vehicle-form';

export default function NewVehiclePage() {
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const handleSubmit = async (data: CreateVehicleInput) => {
    const vehicle = await createVehicle.mutateAsync(data);
    router.push(`/vehicles/${vehicle.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">New Vehicle</h1>
      <VehicleForm onSubmit={handleSubmit} isLoading={createVehicle.isPending} />
    </div>
  );
}
