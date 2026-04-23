import { ServiceOrderStatus, TaskStatus } from './enums.js';

export interface ServiceOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  estimate_id: string;
  customer_id: string;
  vehicle_id: string;
  status: ServiceOrderStatus;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  estimated_completion: string | null;
  total_labor_hours: string;
  total_parts_cost: string;
  total_amount: string;
  notes: string | null;
  is_paused_by_dispute: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ServiceOrderTask {
  id: string;
  tenant_id: string;
  service_order_id: string;
  description: string;
  status: TaskStatus;
  assigned_to: string | null;
  estimated_hours: string | null;
  actual_hours: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderTimeEntry {
  id: string;
  tenant_id: string;
  service_order_id: string;
  task_id: string | null;
  user_id: string;
  start_time: string;
  end_time: string | null;
  hours: string | null;
  notes: string | null;
  created_at: string;
}
