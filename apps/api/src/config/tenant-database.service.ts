import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Knex } from 'knex';
import type { Request } from 'express';
import { KNEX_CONNECTION } from './database.module';

/**
 * Request-scoped service that provides a Knex instance with:
 * 1. search_path set to the tenant's schema (schema-level isolation)
 * 2. app.current_tenant_id session variable set (for RLS policies)
 *
 * This dual-layer approach ensures tenant isolation even if application
 * code forgets a WHERE tenant_id = X clause.
 *
 * Services should inject this instead of KNEX_CONNECTION directly
 * for any tenant-scoped data access.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantDatabaseService {
  private schemaSet = false;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Returns a Knex query builder scoped to the current tenant's schema.
   * The search_path is set on first call and cached for the request lifecycle.
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
