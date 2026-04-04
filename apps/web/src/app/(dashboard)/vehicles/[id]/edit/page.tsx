'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicle, useUpdateVehicle, type CreateVehicleInput } from '@/hooks/use-vehicles';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { Button } from '@/components/ui/button';

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const updateVehicle = useUpdateVehicle(id);

  const handleSubmit = async (data: CreateVehicleInput) => {
    await updateVehicle.mutateAsync(data);
    router.push(`/vehicles/${id}`);
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (error || !vehicle) return (
    <div className="space-y-4">
      <p className="text-destructive">{error ? `Failed to load: ${error.message}` : 'Vehicle not found'}</p>
      <Link href="/vehicles"><Button variant="outline">Back to Vehicles</Button></Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={`/vehicles/${id}`} className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Vehicle</Link>
      <h1 className="text-3xl font-bold">Edit: {vehicle.year} {vehicle.make} {vehicle.model}</h1>
      <VehicleForm initialData={vehicle} onSubmit={handleSubmit} isLoading={updateVehicle.isPending} />
    </div>
  );
}
