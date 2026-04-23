import { EstimateStatus, EstimateLineType } from './enums.js';

export interface Estimate {
  id: string;
  tenant_id: string;
  estimate_number: string;
  customer_id: string;
  vehicle_id: string;
  insurance_company_id: string | null;
  claim_number: string | null;
  status: EstimateStatus;
  subtotal: string;
  tax_amount: string;
  total: string;
  deductible: string | null;
  notes: string | null;
  estimated_by: string;
  approved_at: string | null;
  approved_by: string | null;
  valid_until: string | null;
  dispute_reason: string | null;
  dispute_notes: string | null;
  dispute_opened_at: string | null;
  dispute_resolved_at: string | null;
  blocks_so_progression: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EstimateLine {
  id: string;
  tenant_id: string;
  estimate_id: string;
  line_type: EstimateLineType;
  description: string;
  quantity: string;
  unit_price: string;
  total: string;
  is_taxable: boolean;
  sort_order: number;
  created_at: string;
}

export interface EstimateSupplement {
  id: string;
  tenant_id: string;
  estimate_id: string;
  supplement_number: number;
  reason: string;
  amount: string;
  status: EstimateStatus;
  requested_by: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}
