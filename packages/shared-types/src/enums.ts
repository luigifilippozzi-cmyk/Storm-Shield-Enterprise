// ── Tenant ──
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

// ── User / RBAC ──
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ESTIMATOR = 'estimator',
  TECHNICIAN = 'technician',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
}

// ── CRM ──
export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum CustomerSource {
  INSURANCE = 'insurance',
  WALK_IN = 'walk_in',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  OTHER = 'other',
}

export enum InteractionType {
  PHONE = 'phone',
  EMAIL = 'email',
  IN_PERSON = 'in_person',
  SMS = 'sms',
}

// ── Vehicle ──
export enum VehicleCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

// ── Estimate ──
export enum EstimateStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPPLEMENT_REQUESTED = 'supplement_requested',
  CONVERTED = 'converted',
}

export enum EstimateLineType {
  LABOR = 'labor',
  PARTS = 'parts',
  PAINT = 'paint',
  SUBLET = 'sublet',
  OTHER = 'other',
}

// ── Service Order ──
export enum ServiceOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  WAITING_APPROVAL = 'waiting_approval',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

// ── Financial ──
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  ACH = 'ach',
  WIRE = 'wire',
  INSURANCE_PAYMENT = 'insurance_payment',
}

export enum PaymentStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
}

// ── Accounting ──
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum NormalBalance {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum JournalEntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  REVERSED = 'reversed',
}

export enum FiscalPeriodStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  LOCKED = 'locked',
}

// ── Fixed Assets ──
export enum DepreciationMethod {
  STRAIGHT_LINE = 'straight_line',
  MACRS = 'macrs',
  DECLINING_BALANCE = 'declining_balance',
  SUM_OF_YEARS = 'sum_of_years',
  UNITS_OF_PRODUCTION = 'units_of_production',
}

export enum AssetStatus {
  ACTIVE = 'active',
  FULLY_DEPRECIATED = 'fully_depreciated',
  DISPOSED = 'disposed',
  INACTIVE = 'inactive',
}

export enum DisposalType {
  SALE = 'sale',
  WRITE_OFF = 'write_off',
  DONATION = 'donation',
  TRADE_IN = 'trade_in',
}

// ── Contractor ──
export enum ContractorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ── Notification ──
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}
