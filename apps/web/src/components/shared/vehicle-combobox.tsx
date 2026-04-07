'use client';

import { useState } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';

interface VehicleComboboxProps {
  customerId: string;
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function VehicleCombobox({ customerId, value, onChange, error }: VehicleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data } = useVehicles(
    customerId ? { customer_id: customerId, search, limit: 20 } : { limit: 0 },
  );
  const vehicles = data?.data || [];

  const selectedVehicle = vehicles.find((v) => v.id === value);
  const displayLabel = selectedVehicle
    ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
    : value
      ? 'Loading...'
      : 'Select vehicle...';

  const disabled = !customerId;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-start font-normal"
          >
            {disabled ? 'Select a customer first...' : displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search vehicles..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No vehicles found for this customer.</CommandEmpty>
              {vehicles.map((vehicle) => (
                <CommandItem
                  key={vehicle.id}
                  value={vehicle.id}
                  onSelect={() => {
                    onChange(vehicle.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                    {vehicle.vin && (
                      <span className="text-xs text-muted-foreground">VIN: {vehicle.vin}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
