import { TransactionType, PaymentMethod, PaymentStatus } from './enums';

export interface FinancialTransaction {
  id: string;
  tenant_id: string;
  transaction_type: TransactionType;
  category: string;
  description: string;
  amount: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  service_order_id: string | null;
  customer_id: string | null;
  contractor_id: string | null;
  transaction_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InsurancePayment {
  id: string;
  tenant_id: string;
  insurance_company_id: string;
  estimate_id: string;
  service_order_id: string | null;
  claim_number: string;
  expected_amount: string;
  received_amount: string | null;
  status: PaymentStatus;
  check_number: string | null;
  received_date: string | null;
  check_reminder_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsuranceCompany {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  is_drp: boolean;
  payment_terms_days: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
