'use client';

import { useState, useEffect } from 'react';
import { useCustomers } from '@/hooks/use-customers';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';

interface CustomerComboboxProps {
  value: string;
  onChange: (id: string) => void;
  /** Optional callback that also receives the human-readable display label */
  onChangeWithLabel?: (id: string, label: string) => void;
  error?: string;
}

export function CustomerCombobox({ value, onChange, onChangeWithLabel, error }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data } = useCustomers({ search: debouncedSearch, limit: 10 });
  const customers = data?.data || [];

  // Find selected customer name for display
  const selectedCustomer = customers.find((c) => c.id === value);
  const displayLabel = selectedCustomer
    ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
    : value
      ? 'Loading...'
      : 'Select customer...';

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start font-normal"
          >
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search customers..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    const label = `${customer.first_name} ${customer.last_name}`;
                    onChange(customer.id);
                    onChangeWithLabel?.(customer.id, label);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {customer.first_name} {customer.last_name}
                    </span>
                    {customer.phone && (
                      <span className="text-xs text-muted-foreground">{customer.phone}</span>
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
