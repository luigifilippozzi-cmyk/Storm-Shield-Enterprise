import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const ESTIMATE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:                    { label: 'Draft',                  className: 'bg-gray-100 text-gray-700 border-gray-200' },
  submitted_to_adjuster:    { label: 'Submitted',              className: 'bg-blue-100 text-blue-800 border-blue-200' },
  awaiting_approval:        { label: 'Awaiting Approval',      className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved:                 { label: 'Approved',               className: 'bg-green-100 text-green-800 border-green-200' },
  supplement_pending:       { label: 'Supplement Pending',     className: 'bg-orange-100 text-orange-800 border-orange-200' },
  approved_with_supplement: { label: 'Approved + Supplement',  className: 'bg-green-100 text-green-800 border-green-200' },
  rejected:                 { label: 'Rejected',               className: 'bg-red-100 text-red-800 border-red-200' },
  disputed:                 { label: 'Disputed',               className: 'bg-red-100 text-red-800 border-red-200' },
  paid:                     { label: 'Paid',                   className: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  closed:                   { label: 'Closed',                 className: 'bg-slate-200 text-slate-800 border-slate-300' },
};

interface EstimateStatusBadgeProps {
  status: string;
  className?: string;
}

export function EstimateStatusBadge({ status, className }: EstimateStatusBadgeProps) {
  const config = ESTIMATE_STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <Badge className={cn('border text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
