import { CustomerType, CustomerSource, InteractionType } from './enums.js';

export interface Customer {
  id: string;
  tenant_id: string;
  type: CustomerType;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string;
  phone_secondary: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: CustomerSource;
  insurance_company_id: string | null;
  policy_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomerInteraction {
  id: string;
  tenant_id: string;
  customer_id: string;
  user_id: string;
  type: InteractionType;
  subject: string;
  notes: string | null;
  interaction_date: string;
  created_at: string;
}
