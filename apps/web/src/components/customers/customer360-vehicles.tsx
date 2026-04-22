'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVehicles } from '@/hooks/use-vehicles';

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
};

export function Customer360Vehicles({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useVehicles({ customer_id: customerId, limit: 50 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load vehicles: {error.message}</p>;
  }

  const vehicles = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
        <Link href={`/vehicles/new?customer_id=${customerId}`}>
          <Button size="sm" variant="outline">Add Vehicle</Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No vehicles on record.</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">
                  {v.year} {v.make} {v.model}
                  {v.trim ? ` ${v.trim}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {v.color ? `${v.color} · ` : ''}
                  {v.vin ? `VIN: ${v.vin}` : 'No VIN'}
                </p>
              </div>
              {v.condition && (
                <Badge className={`border-transparent capitalize ${CONDITION_COLORS[v.condition] ?? ''}`}>
                  {v.condition}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
