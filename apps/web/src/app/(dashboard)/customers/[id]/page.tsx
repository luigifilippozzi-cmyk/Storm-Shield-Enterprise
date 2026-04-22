'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomer, useDeleteCustomer } from '@/hooks/use-customers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Customer360Overview } from '@/components/customers/customer360-overview';
import { Customer360Vehicles } from '@/components/customers/customer360-vehicles';
import { Customer360Estimates } from '@/components/customers/customer360-estimates';
import { Customer360ServiceOrders } from '@/components/customers/customer360-service-orders';
import { Customer360Receivables } from '@/components/customers/customer360-receivables';
import { Customer360Activity } from '@/components/customers/customer360-activity';
import { Customer360Documents } from '@/components/customers/customer360-documents';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'estimates', label: 'Estimates' },
  { value: 'service-orders', label: 'Service Orders' },
  { value: 'receivables', label: 'Payments & Receivables' },
  { value: 'activity', label: 'Activity' },
  { value: 'documents', label: 'Documents' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') as TabValue | null;
  const activeTab: TabValue = TABS.some((t) => t.value === rawTab) ? (rawTab as TabValue) : 'overview';

  const { data: customer, isLoading, error } = useCustomer(id);
  const deleteCustomer = useDeleteCustomer();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/customers/${id}?${params.toString()}`, { scroll: false });
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!confirm(`Delete ${customer.first_name} ${customer.last_name}? This cannot be undone.`)) return;
    await deleteCustomer.mutateAsync(customer.id);
    router.push('/customers');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/customers"
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Customers
          </Link>
          <h1 className="text-3xl font-bold">
            {customer.first_name} {customer.last_name}
          </h1>
          {customer.company_name && (
            <p className="text-muted-foreground">{customer.company_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/estimates/new?customer_id=${customer.id}`}>
            <Button size="sm">New Estimate</Button>
          </Link>
          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <Customer360Overview customer={customer} />
        </TabsContent>

        <TabsContent value="vehicles">
          <Customer360Vehicles customerId={customer.id} />
        </TabsContent>

        <TabsContent value="estimates">
          <Customer360Estimates customerId={customer.id} />
        </TabsContent>

        <TabsContent value="service-orders">
          <Customer360ServiceOrders customerId={customer.id} />
        </TabsContent>

        <TabsContent value="receivables">
          <Customer360Receivables customerId={customer.id} />
        </TabsContent>

        <TabsContent value="activity">
          <Customer360Activity customerId={customer.id} />
        </TabsContent>

        <TabsContent value="documents">
          <Customer360Documents customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
