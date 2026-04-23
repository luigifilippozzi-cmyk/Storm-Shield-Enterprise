'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { ESTIMATE_STATUS_CONFIG } from './estimate-status-badge';
import { useUpdateEstimateStatusById } from '@/hooks/use-estimates';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Estimate } from '@sse/shared-types';

// Static transition map — mirrors backend ALLOWED_TRANSITIONS (RF-005a).
// DM decision: static bundle preferred over GET /estimates/state-machine/transitions
// to avoid extra round-trip on page load; transitions are fixed spec constants.
const ALLOWED_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  draft:                    new Set(['submitted_to_adjuster']),
  submitted_to_adjuster:    new Set(['awaiting_approval', 'rejected']),
  awaiting_approval:        new Set(['approved', 'supplement_pending', 'rejected', 'disputed']),
  approved:                 new Set(['approved_with_supplement', 'paid', 'disputed', 'closed']),
  supplement_pending:       new Set(['awaiting_approval']),
  approved_with_supplement: new Set(['paid', 'disputed', 'closed']),
  rejected:                 new Set(['draft']),
  disputed:                 new Set(['awaiting_approval', 'paid', 'closed']),
  paid:                     new Set(['closed']),
  closed:                   new Set(),
};

const COLUMN_ORDER = [
  'draft', 'submitted_to_adjuster', 'awaiting_approval', 'approved',
  'supplement_pending', 'approved_with_supplement', 'rejected',
  'disputed', 'paid', 'closed',
] as const;

// API returns joined fields not in the base Estimate type
interface EstimateRow extends Estimate {
  customer_name?: string | null;
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  estimate: EstimateRow;
  isDragging?: boolean;
}

function EstimateCard({ estimate, isDragging = false }: CardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: estimate.id,
    data: { fromStatus: estimate.status },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const daysSince = Math.floor(
    (Date.now() - new Date(estimate.updated_at).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-md border bg-background p-3 shadow-sm select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging ? 'opacity-50 rotate-2 shadow-lg' : 'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
      )}
      aria-roledescription="draggable estimate card"
      aria-label={`Estimate ${estimate.estimate_number}, drag to change status`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-foreground">{estimate.estimate_number}</span>
        {daysSince >= 1 && (
          <span className={cn(
            'rounded px-1.5 py-0.5 text-xs',
            daysSince >= 14 ? 'bg-destructive/10 text-destructive' :
            daysSince >= 7  ? 'bg-warning/10 text-warning' :
                              'bg-muted text-muted-foreground',
          )}>
            {daysSince}d
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {estimate.customer_name ?? '—'}
      </p>
      <p className="mt-0.5 text-xs font-medium tabular-nums">
        ${parseFloat(String(estimate.total ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <button
        type="button"
        className="mt-2 text-xs text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        onClick={(e) => { e.stopPropagation(); router.push(`/estimates/${estimate.id}`); }}
        aria-label={`Open estimate ${estimate.estimate_number}`}
      >
        View
      </button>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: string;
  estimates: EstimateRow[];
  isOver: boolean;
  canDrop: boolean;
}

function KanbanColumn({ status, estimates, isOver, canDrop }: ColumnProps) {
  const config = ESTIMATE_STATUS_CONFIG[status] ?? { label: status, className: '' };
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-w-[220px] flex-col rounded-lg border transition-colors',
        isOver && canDrop  ? 'border-primary bg-primary/5 ring-1 ring-primary' : '',
        isOver && !canDrop ? 'border-destructive bg-destructive/5 ring-1 ring-destructive' : '',
        !isOver            ? 'border-border bg-muted/30' : '',
      )}
      role="region"
      aria-label={`${config.label} column, ${estimates.length} estimate${estimates.length !== 1 ? 's' : ''}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', config.className)}>
          {config.label}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {estimates.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {estimates.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No estimates</p>
        ) : (
          estimates.map((est) => <EstimateCard key={est.id} estimate={est} />)
        )}
      </div>
    </div>
  );
}

// ── Kanban skeleton (shown while loading) ─────────────────────────────────────

export function EstimatesKanbanSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-[72px] w-full rounded-lg" />
      <div
        className="flex gap-3 overflow-x-hidden pb-4"
        style={{ minHeight: '60vh' }}
        aria-label="Loading kanban board"
        aria-busy="true"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex min-w-[220px] flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Kanban root ───────────────────────────────────────────────────────────────

interface EstimatesKanbanProps {
  estimates: EstimateRow[];
}

export function EstimatesKanban({ estimates }: EstimatesKanbanProps) {
  const updateStatus = useUpdateEstimateStatusById();

  const [activeEstimate, setActiveEstimate] = useState<EstimateRow | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const dragErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dragErrorTimerRef.current) clearTimeout(dragErrorTimerRef.current);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // Group estimates by status
  const byStatus = COLUMN_ORDER.reduce<Record<string, EstimateRow[]>>((acc, s) => {
    acc[s] = estimates.filter((e) => e.status === s);
    return acc;
  }, {} as Record<string, EstimateRow[]>);

  // Hero counters — actionable SLA statuses (C3 — PV3/PUX1)
  const awaitingCount = byStatus['awaiting_approval']?.length ?? 0;
  const supplementCount = byStatus['supplement_pending']?.length ?? 0;
  const disputedCount = byStatus['disputed']?.length ?? 0;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const est = estimates.find((e) => e.id === event.active.id);
    setActiveEstimate(est ?? null);
    if (dragErrorTimerRef.current) clearTimeout(dragErrorTimerRef.current);
    setDragError(null);
  }, [estimates]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverColumn(event.over ? String(event.over.id) : null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveEstimate(null);
    setOverColumn(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromStatus = (active.data.current as { fromStatus: string } | undefined)?.fromStatus;
    const toStatus = over.id as string;

    if (!fromStatus || fromStatus === toStatus) return;

    const showError = (msg: string) => {
      if (dragErrorTimerRef.current) clearTimeout(dragErrorTimerRef.current);
      setDragError(msg);
      dragErrorTimerRef.current = setTimeout(() => setDragError(null), 4000);
    };

    const allowed = ALLOWED_TRANSITIONS[fromStatus];
    if (!allowed || !allowed.has(toStatus)) {
      const allowedList = allowed ? [...allowed].join(', ') || 'none' : 'unknown';
      showError(
        `Cannot move from "${ESTIMATE_STATUS_CONFIG[fromStatus]?.label ?? fromStatus}" to "${ESTIMATE_STATUS_CONFIG[toStatus]?.label ?? toStatus}". Allowed: ${allowedList}.`,
      );
      return;
    }

    try {
      await updateStatus.mutateAsync({ id: String(active.id), status: toStatus });
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to update estimate status.');
    }
  }, [updateStatus]);

  const canDrop = overColumn !== null && activeEstimate !== null
    ? (ALLOWED_TRANSITIONS[activeEstimate.status]?.has(overColumn) ?? false)
    : false;

  return (
    <div className="flex flex-col gap-3">
      {/* Hero strip — actionable SLA status counters (PV3/PUX1) */}
      <div
        className="flex flex-wrap gap-6 rounded-lg border bg-card p-4"
        aria-label="Estimate status summary"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-bold tabular-nums text-foreground">{awaitingCount}</span>
          <span className="text-xs text-muted-foreground">Awaiting Approval</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-bold tabular-nums text-warning">{supplementCount}</span>
          <span className="text-xs text-muted-foreground">Supplement Pending</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-bold tabular-nums text-destructive">{disputedCount}</span>
          <span className="text-xs text-muted-foreground">Disputed</span>
        </div>
      </div>

      {/* Drag error banner */}
      {dragError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {dragError}
        </div>
      )}

      {/* Kanban board — horizontal scroll on mobile (PUX6) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-3 overflow-x-auto pb-4"
          style={{ minHeight: '60vh' }}
          aria-label="Estimates kanban board"
        >
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              estimates={byStatus[status]}
              isOver={overColumn === status}
              canDrop={canDrop}
            />
          ))}
        </div>

        {/* Drag overlay — ghost card following pointer */}
        <DragOverlay>
          {activeEstimate ? (
            <EstimateCard estimate={activeEstimate} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
