# ADR-003: Double-Entry Bookkeeping for General Ledger

**Date:** 2026-04-04
**Status:** Accepted (implementation deferred to Phase 3)
**Deciders:** Luigi Filippozzi

## Context

SSE requires accounting capabilities for auto repair businesses. The system must produce standard financial reports (P&L, Balance Sheet, Trial Balance) and comply with US GAAP for small businesses.

### Options Considered

1. **Single-entry ledger** - Simple income/expense tracking (Phase 1 approach)
2. **Double-entry bookkeeping** - Every transaction creates balanced debit/credit journal entries
3. **External accounting only** - Export to QuickBooks/Xero, no internal GL

## Decision

**Double-entry bookkeeping** as the target architecture (Phase 3), with single-entry financial tracking in Phase 1 MVP.

Phase 1 uses `financial_transactions` with type (income/expense) for basic tracking. Phase 3 will introduce `chart_of_accounts`, `journal_entries`, `journal_entry_lines`, `fiscal_periods`, and `account_balances`.

## Rationale

- **US GAAP compliance**: Body shops with insurance billing need proper accrual accounting
- **Audit trail**: Double-entry is self-balancing (debits = credits), providing built-in error detection
- **Fixed asset management**: Depreciation requires journal entries (D: Depreciation Expense / C: Accumulated Depreciation)
- **Insurance reconciliation**: AR aging reports require proper GL accounts

## Chart of Accounts Structure

```
1000-1999  Assets          (Normal balance: Debit)
2000-2999  Liabilities     (Normal balance: Credit)
3000-3999  Equity          (Normal balance: Credit)
4000-4999  Revenue         (Normal balance: Credit)
5000-9999  Expenses        (Normal balance: Debit)
```

## Consequences

- Phase 1 financial data will need migration/reconciliation when GL is introduced in Phase 3
- All monetary values use `DECIMAL(14,2)` — never FLOAT
- Journal entries are append-only (no DELETE on financial records, no CASCADE DELETE)

## Related

- [ADR-004: Fixed Asset Management](004-fixed-asset-management.md)
