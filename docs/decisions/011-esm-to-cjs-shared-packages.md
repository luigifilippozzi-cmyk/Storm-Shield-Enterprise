# ADR-011 — ESM→CJS Migration for Shared Packages + Fly.io Crash Fixes

**Status:** Accepted  
**Date:** 2026-04-22  
**Deciders:** DM Agent  
**Context:** T-20260421-10 — 9-day staging pipeline blockage  

---

## Context

The staging deploy pipeline (Fly.io) had been failing since 2026-04-13 with `ERR_MODULE_NOT_FOUND` on startup. The root cause was a cascade of 4 independent issues discovered incrementally via Fly.io container logs:

1. **ESM barrel exports without `.js` extension**: `packages/shared-utils/src/index.ts` used `export * from './uuid'` (no extension). With `module: "ESNext"` + `moduleResolution: "bundler"`, TSC emits the same bare specifier in dist output. Node.js ESM runtime requires explicit extensions.

2. **Missing `node_modules` in Docker runner stage**: The Dockerfile copied `packages/shared-utils/dist` but not `packages/shared-utils/node_modules`. pnpm does not hoist workspace package dependencies to root, so `uuid` and `zod` were missing at runtime.

3. **CJS circular import**: After switching to NodeNext/CJS, `database.module.ts` ↔ `tenant-database.service.ts` formed a circular `require()` cycle. In CJS, circular requires return a partially-initialized module object, so `KNEX_CONNECTION` was `undefined` when NestJS tried to inject it.

4. **AuthService not available in guard context**: `AuthGuard` was used with `@UseGuards()` on controllers in non-auth modules. NestJS resolves guard dependencies from the owning module's context, and `AuthService` was only provided in `AuthModule` — not imported by `UsersModule` and peers.

## Decisions

### 1. Switch `tsconfig.base.json` to NodeNext

Changed `module: "ESNext"` + `moduleResolution: "bundler"` → `module: "NodeNext"` + `moduleResolution: "NodeNext"`.

**Rationale:** `bundler` resolution was designed for webpack/vite pipelines. Shared packages are consumed by a Node.js runtime (Docker container); NodeNext produces CJS output (no `"type": "module"` in `package.json`) which resolves modules correctly in Node.js without explicit `.js` extensions at require()-time.

**Trade-off:** Switching to CJS exposed the circular import issue (item 3). ESM uses live bindings which tolerate circular imports transparently.

### 2. Explicit `.js` extensions in barrel re-exports

All `export * from './module'` → `export * from './module.js'` in `index.ts` files for both `shared-types` and `shared-utils`, plus internal cross-file imports within `shared-types`.

**Rationale:** Required for TypeScript NodeNext to compile correctly. Also correct for any future ESM usage.

### 3. Copy `packages/shared-utils/node_modules` in Dockerfile runner stage

Added `COPY --from=deps --chown=nestjs:nodejs /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules` to the runner stage.

**Rationale:** pnpm strict linking installs each workspace package's dependencies in its own `node_modules`, not the root. The runner stage must include these for runtime resolution.

### 4. Extract DB tokens to `database.tokens.ts`

Moved `KNEX_CONNECTION` and `KNEX_ADMIN_CONNECTION` string constants from `database.module.ts` to a new `database.tokens.ts` file. `tenant-database.service.ts` now imports from `database.tokens.ts` directly. `database.module.ts` re-exports both tokens for backwards compatibility.

**Rationale:** Breaks the `database.module.ts` ↔ `tenant-database.service.ts` circular CJS require. The root cause was that NestJS's `@Inject(KNEX_CONNECTION)` decorator receives `undefined` when the circular require returns a partial module.

### 5. Make `AuthModule` global

Added `@Global()` to `AuthModule`.

**Rationale:** `AuthGuard` is applied via `@UseGuards()` on controllers in every domain module. NestJS resolves guard dependencies from the controller's module context. Making `AuthModule` global makes `AuthService` available application-wide without requiring each domain module to import `AuthModule`.

**Alternative considered:** Register guards as `APP_GUARD` in `AppModule` and remove per-controller `@UseGuards()`. Rejected due to scope (would touch all controllers) and timing (hotfix session).

## Health check improvements

- Fly.io `fly.toml`: `grace_period` 10s→30s, `interval` 30s→15s, `timeout` 5s→10s. NestJS bootstrap with 15 modules takes ~15s; the 10s grace was too short for the first health check to pass.
- CI workflow: Added `flyctl logs --no-tail` diagnostic step after every deploy (pass or fail) to surface container crash output. Extended smoke test curl timeout to 60s with 8 retries.

## Result

- `curl https://sse-api-staging.fly.dev/health` → `{"status":"ok","timestamp":"..."}` (attempt 1, ~7s)
- Fly.io machine: `STATE=started`, `CHECKS=1/1`
- 363/363 tests passing
- T-20260421-10 CLOSED

## Not yet done

`/ready` returns 503 (expected): `DATABASE_URL` and `REDIS_URL` are not configured as Fly.io secrets for the running app. Only `DATABASE_URL_UNPOOLED` is set (used by migrations). Luigi must run:
```
fly secrets set DATABASE_URL=<neon-pooled-url> REDIS_URL=<upstash-url> --app sse-api-staging
```
