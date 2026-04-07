'use client';

import { formatDate } from '@/lib/utils';

interface StatusEntry {
  status: string;
  timestamp: string;
  label: string;
}

interface StatusTimelineProps {
  estimate: {
    status: string;
    created_at: string;
    updated_at: string;
    approved_at?: string | null;
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft Created',
  sent: 'Sent to Customer',
  approved: 'Approved',
  rejected: 'Rejected',
  supplement_requested: 'Supplement Requested',
  converted: 'Converted to Service Order',
};

const STATUS_ICONS: Record<string, string> = {
  draft: 'bg-gray-400',
  sent: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  supplement_requested: 'bg-yellow-500',
  converted: 'bg-purple-500',
};

export function StatusTimeline({ estimate }: StatusTimelineProps) {
  const entries: StatusEntry[] = [
    { status: 'draft', timestamp: estimate.created_at, label: 'Estimate created as draft' },
  ];

  if (estimate.status !== 'draft') {
    entries.push({
      status: estimate.status,
      timestamp: estimate.approved_at || estimate.updated_at,
      label: STATUS_LABELS[estimate.status] || estimate.status,
    });
  }

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Status Timeline</h2>
      </div>
      <div className="px-4 py-3">
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${STATUS_ICONS[entry.status] || 'bg-gray-400'}`} />
                {i < entries.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
