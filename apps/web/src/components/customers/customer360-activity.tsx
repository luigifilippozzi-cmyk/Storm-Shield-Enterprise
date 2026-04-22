'use client';

import { formatDate } from '@/lib/utils';
import { useCustomerActivityTimeline } from '@/hooks/use-customers';
import type { ActivityEvent } from '@/hooks/use-customers';

const EVENT_ICONS: Record<string, string> = {
  interaction: '💬',
  so_status_change: '🔧',
  payment: '💰',
  estimate_created: '📋',
};

const EVENT_LABELS: Record<string, string> = {
  interaction: 'Interaction',
  so_status_change: 'SO Status Change',
  payment: 'Payment',
  estimate_created: 'Estimate',
};

function EventRow({ event }: { event: ActivityEvent }) {
  const icon = EVENT_ICONS[event.event_type] ?? '•';
  const label = EVENT_LABELS[event.event_type] ?? event.event_type;

  const detail = (() => {
    if (event.event_type === 'so_status_change' && event.from_status && event.to_status) {
      return `${event.from_status?.replace('_', ' ')} → ${event.to_status.replace('_', ' ')}`;
    }
    if (event.event_type === 'payment' && event.amount != null) {
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(event.amount));
      return `${event.event_subtype} · ${formatted}`;
    }
    if (event.event_type === 'interaction') {
      return event.event_subtype?.replace('_', ' ');
    }
    if (event.event_type === 'estimate_created') {
      return event.event_subtype; // status
    }
    return null;
  })();

  return (
    <div className="flex gap-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{event.description}</p>
          <p className="shrink-0 text-xs text-muted-foreground">{formatDate(event.occurred_at)}</p>
        </div>
        {detail && <p className="text-xs text-muted-foreground capitalize">{label} · {detail}</p>}
        {!detail && <p className="text-xs text-muted-foreground">{label}</p>}
        {event.notes && <p className="mt-0.5 text-xs text-muted-foreground italic">{event.notes}</p>}
      </div>
    </div>
  );
}

export function Customer360Activity({ customerId }: { customerId: string }) {
  const { data: events, isLoading, error } = useCustomerActivityTimeline(customerId, 100);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load activity: {error.message}</p>;
  }

  if (!events?.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''}</p>
      <div className="divide-y rounded-lg border px-4">
        {events.map((event) => (
          <EventRow key={`${event.event_type}-${event.id}`} event={event} />
        ))}
      </div>
    </div>
  );
}
