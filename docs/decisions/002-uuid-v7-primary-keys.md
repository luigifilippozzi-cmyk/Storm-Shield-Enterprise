# ADR-002: UUID v7 as Primary Keys

**Date:** 2026-04-04
**Status:** Accepted
**Deciders:** Luigi Filippozzi

## Context

We need a primary key strategy for all 65+ entities across 12 domains. The key must support multi-tenant schema isolation, avoid collisions when merging data, and maintain good index performance.

### Options Considered

1. **Auto-increment integers** - Simple but leaks information, collides across tenants, non-portable
2. **UUID v4** - Universally unique but random, causing poor B-tree index locality
3. **UUID v7** - Time-ordered UUID (RFC 9562), combines uniqueness with temporal sorting
4. **ULID / KSUID** - Similar to UUID v7 but non-standard

## Decision

**UUID v7** for all primary keys, generated via `generateId()` from `@sse/shared-utils`.

## Rationale

- **Time-ordered**: UUID v7 embeds a Unix timestamp in the first 48 bits, so B-tree indexes maintain insertion order. This dramatically reduces page splits compared to UUID v4.
- **Universally unique**: No collision risk across tenants, schemas, or environments.
- **Standard**: RFC 9562 (May 2024). PostgreSQL's `gen_random_uuid()` is used as a fallback in DDL defaults.
- **Non-enumerable**: Unlike auto-increment, UUIDs don't reveal entity counts or creation order to API consumers.

## Consequences

- Storage: 16 bytes per key (vs 4-8 for integers). Acceptable for our scale.
- All `INSERT` operations must call `generateId()` — never rely on DB default for application-generated records.
- Foreign key references use `UUID` type throughout all migrations.

## Implementation

```typescript
// packages/shared-utils/src/uuid.ts
import { v7 as uuidv7 } from 'uuid';
export const generateId = (): string => uuidv7();
```
