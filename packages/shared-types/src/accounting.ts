import {
  AccountType,
  NormalBalance,
  JournalEntryStatus,
  FiscalPeriodStatus,
  DepreciationMethod,
  AssetStatus,
  DisposalType,
} from './enums.js';

// ── General Ledger ──
export interface ChartOfAccount {
  id: string;
  tenant_id: string;
  account_number: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_id: string | null;
  is_active: boolean;
  is_system: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  fiscal_period_id: string;
  entry_date: string;
  description: string;
  status: JournalEntryStatus;
  reference_type: string | null;
  reference_id: string | null;
  total_debit: string;
  total_credit: string;
  created_by: string;
  posted_at: string | null;
  posted_by: string | null;
  reversed_entry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: string;
  credit: string;
  description: string | null;
  sort_order: number;
}

export interface FiscalPeriod {
  id: string;
  tenant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: FiscalPeriodStatus;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

// ── Fixed Asset Management ──
export interface AssetCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  default_useful_life_months: number;
  default_depreciation_method: DepreciationMethod;
  default_salvage_value_pct: string;
  gl_asset_account_id: string;
  gl_depreciation_account_id: string;
  gl_accumulated_depreciation_account_id: string;
  macrs_class_life: number | null;
  created_at: string;
  updated_at: string;
}

export interface FixedAsset {
  id: string;
  tenant_id: string;
  asset_number: string;
  name: string;
  description: string | null;
  category_id: string;
  status: AssetStatus;
  acquisition_date: string;
  acquisition_cost: string;
  salvage_value: string;
  useful_life_months: number;
  depreciation_method: DepreciationMethod;
  depreciation_start_date: string;
  accumulated_depreciation: string;
  net_book_value: string;
  serial_number: string | null;
  location: string | null;
  assigned_to: string | null;
  warranty_expiry: string | null;
  disposed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DepreciationSchedule {
  id: string;
  tenant_id: string;
  asset_id: string;
  period_number: number;
  period_date: string;
  depreciation_amount: string;
  accumulated_depreciation: string;
  net_book_value: string;
  is_executed: boolean;
  journal_entry_id: string | null;
  executed_at: string | null;
}

export interface AssetDisposal {
  id: string;
  tenant_id: string;
  asset_id: string;
  disposal_type: DisposalType;
  disposal_date: string;
  proceeds: string;
  net_book_value_at_disposal: string;
  gain_loss: string;
  journal_entry_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}
