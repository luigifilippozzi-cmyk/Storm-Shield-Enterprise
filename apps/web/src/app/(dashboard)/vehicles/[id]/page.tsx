'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicle, useDeleteVehicle } from '@/hooks/use-vehicles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 border-b py-3 last:border-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!confirm(`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}?`)) return;
    await deleteVehicle.mutateAsync(vehicle.id);
    router.push('/vehicles');
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
      <div className="flex items-start justify-between">
        <div>
          <Link href="/vehicles" className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Back to Vehicles</Link>
          <h1 className="text-3xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
          {vehicle.trim && <p className="text-muted-foreground">{vehicle.trim}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/vehicles/${vehicle.id}/edit`}><Button variant="outline">Edit</Button></Link>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      {vehicle.condition && (
        <Badge variant="outline" className="capitalize">{vehicle.condition}</Badge>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Vehicle Details</h2></div>
        <dl className="px-4">
          <DetailRow label="VIN" value={vehicle.vin ? <code className="text-xs">{vehicle.vin}</code> : null} />
          <DetailRow label="Color" value={vehicle.color} />
          <DetailRow label="Mileage" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : null} />
        </dl>
      </section>

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Registration</h2></div>
        <dl className="px-4">
          <DetailRow label="License Plate" value={vehicle.license_plate} />
          <DetailRow label="License State" value={vehicle.license_state} />
        </dl>
      </section>

      {vehicle.claim_number && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3"><h2 className="font-semibold">Insurance</h2></div>
          <dl className="px-4">
            <DetailRow label="Claim Number" value={vehicle.claim_number} />
          </dl>
        </section>
      )}

      {vehicle.notes && (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3"><h2 className="font-semibold">Notes</h2></div>
          <div className="whitespace-pre-wrap px-4 py-3 text-sm">{vehicle.notes}</div>
        </section>
      )}

      <section className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Record Info</h2></div>
        <dl className="px-4">
          <DetailRow label="Created" value={formatDate(vehicle.created_at)} />
          <DetailRow label="Updated" value={formatDate(vehicle.updated_at)} />
          <DetailRow label="ID" value={<code className="text-xs">{vehicle.id}</code>} />
        </dl>
      </section>
    </div>
  );
}
