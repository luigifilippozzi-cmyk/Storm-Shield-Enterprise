import { TenantStatus, SubscriptionPlan } from './enums';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  schema_name: string;
  status: TenantStatus;
  subscription_plan: SubscriptionPlan;
  owner_email: string;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  date_format: string;
  fiscal_year_start_month: number;
  tax_rate: string;
  company_info: {
    legal_name: string;
    ein: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
}

export interface User {
  id: string;
  tenant_id: string;
  external_auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module: string;
  action: string;
  resource: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string;
}
