import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Knex } from 'knex';
import type { Request } from 'express';
import { KNEX_CONNECTION } from './database.tokens';

/**
 * Request-scoped service that provides schema-isolated Knex query builders.
 *
 * Isolation strategy (3 layers):
 * 1. Explicit schema qualification via table() — pool-safe, does not rely on
 *    SET search_path (which is reset by PgBouncer in transaction mode).
 * 2. app.current_tenant_id session variable — for RLS policies (best-effort;
 *    may be reset by connection poolers in transaction mode).
 * 3. WHERE tenant_id = X in every query — application-level safety net.
 *
 * Prefer table() over getConnection() for all tenant-scoped data queries.
 * Use getConnection() only for raw SQL or transactions that require a full
 * Knex instance.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantDatabaseService {
  private schemaSet = false;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Returns a QueryBuilder for a tenant-schema-qualified table.
   *
   * Uses explicit schema qualification (e.g. "tenant_xxx"."customers") which
   * is pool-safe — it does NOT depend on SET search_path being preserved
   * across connection pool hops or PgBouncer transaction-mode resets.
   *
   * Prefer this over getConnection() for all standard CRUD operations.
   */
  table<TRecord extends {} = any, TResult = TRecord[]>(
    tableName: string,
  ): Knex.QueryBuilder<TRecord, TResult> {
    const schema = this.request.tenantSchema;
    if (schema) {
      // Explicit schema.table qualification avoids reliance on search_path.
      // Knex (pg dialect) auto-quotes identifiers: "schema"."table".
      return this.knex(`${schema}.${tableName}`) as Knex.QueryBuilder<TRecord, TResult>;
    }
    return this.knex<TRecord, TResult>(tableName);
  }

  /**
   * Returns a Knex instance with search_path set to the tenant schema.
   *
   * WARNING: The SET search_path call may be silently discarded by PgBouncer
   * in transaction mode (Neon pooled URL). Use table() for regular queries;
   * reserve getConnection() for raw SQL or transactions where you manage
   * the connection lifecycle explicitly.
   */
  async getConnection(): Promise<Knex> {
    if (!this.schemaSet && this.request.tenantSchema && this.request.tenantId) {
      await this.knex.raw(`SET search_path TO "${this.request.tenantSchema}", public`);
      await this.knex.raw(`SET app.current_tenant_id TO '${this.request.tenantId}'`);
      this.schemaSet = true;
    }
    return this.knex;
  }

  /**
   * Returns the raw Knex instance for public schema operations (e.g., tenants table).
   * Does NOT set search_path — queries run against public schema.
   */
  getPublicConnection(): Knex {
    return this.knex;
  }

  get tenantId(): string | undefined {
    return this.request.tenantId;
  }

  get tenantSchema(): string | undefined {
    return this.request.tenantSchema;
  }
}
