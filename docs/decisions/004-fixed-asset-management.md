# ADR-004: Fixed Asset Management (FAM)

**Date:** 2026-04-04
**Status:** Accepted (implementation deferred to Phase 3)
**Deciders:** Luigi Filippozzi

## Context

Auto repair businesses own significant fixed assets (equipment, vehicles, tools, leasehold improvements). US tax law (IRS Publication 946) requires proper depreciation tracking, and GAAP requires disclosure of asset values on the balance sheet.

### Options Considered

1. **External FAM** - Use QuickBooks/Xero fixed asset module
2. **Simplified FAM** - Track assets manually, compute depreciation in spreadsheets
3. **Integrated FAM** - Built-in module with 5 depreciation methods and auto-journal-entries

## Decision

**Integrated FAM** with 5 depreciation methods, scheduled depreciation runs, and automatic journal entry generation.

## Depreciation Methods

1. **Straight-Line** - Equal annual depreciation over useful life
2. **MACRS** (Modified Accelerated Cost Recovery System) - IRS Publication 946 rates for tax purposes
3. **Declining Balance** - Accelerated depreciation (150% or 200% DB)
4. **Sum-of-Years-Digits** - Accelerated, decreasing depreciation
5. **Units of Production** - Based on actual usage (e.g., miles driven)

## Data Model (Phase 3)

- `asset_categories` - 6 categories: Machinery, Vehicles, Furniture, Computer, Leasehold, Tools
- `fixed_assets` - Individual asset records with acquisition details
- `depreciation_schedules` - Planned depreciation by period
- `depreciation_entries` - Actual depreciation journal entries
- `asset_disposals` - Sale/scrapping with gain/loss calculation
- `macrs_percentages` - IRS official rates for 3, 5, 7, 10, 15-year classes

## Auto-Journal-Entry Rules

| Event | Debit | Credit |
|---|---|---|
| Monthly depreciation | 5800 Depreciation Expense | 1590 Accumulated Depreciation |
| Asset disposal (gain) | 1590 Accum. Depr. + Cash | 1500 Fixed Asset + 9100 Gain |
| Asset disposal (loss) | 1590 Accum. Depr. + 9100 Loss | 1500 Fixed Asset |

## Consequences

- Requires GL module (ADR-003) to be implemented first
- Monthly depreciation batch job via n8n workflow (`monthly-depreciation.json`)
- MACRS percentages table seeded from IRS Pub 946 data

## Related

- [ADR-003: Double-Entry Bookkeeping](003-double-entry-bookkeeping.md)
- `docs/architecture/SSE_Banco_de_Dados_v1.0.docx` - Full entity design
- `docs/sql/` - Reference DDL and PL/pgSQL functions
