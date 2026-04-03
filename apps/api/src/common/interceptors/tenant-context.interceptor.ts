import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Knex } from 'knex';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.module';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSchema?: string;
      tenantPlan?: string;
      user?: any;
    }
  }
}

/**
 * Resolves tenant context for every request.
 *
 * Tenant ID can come from:
 * 1. X-Tenant-Id header (explicit, used by frontend)
 * 2. X-Clerk-Org-Id header (from Clerk organization context)
 *
 * Once resolved, loads the tenant's plan and status from the DB.
 * Blocks requests from suspended/cancelled tenants.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  // Simple in-memory cache: tenantId -> { plan, status, schema, expiresAt }
  private cache = new Map<
    string,
    { plan: string; status: string; schema: string; expiresAt: number }
  >();
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  constructor(
    @Inject(KNEX_ADMIN_CONNECTION) private readonly knex: Knex,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Resolve tenant ID from headers
    let tenantId = req.headers['x-tenant-id'] as string;

    // Fallback: resolve from Clerk org ID mapped to tenant
    if (!tenantId) {
      const clerkOrgId = req.headers['x-clerk-org-id'] as string;
      if (clerkOrgId) {
        const tenant = await this.knex('tenants')
          .select('id')
          .whereRaw("settings->>'clerk_org_id' = ?", [clerkOrgId])
          .where({ deleted_at: null })
          .first();
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    }

    if (!tenantId) {
      next();
      return;
    }

    // Check cache first
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      if (cached.status !== 'active') {
        res.status(403).json({
          statusCode: 403,
          message: `Tenant account is ${cached.status}. Please contact support.`,
        });
        return;
      }
      req.tenantId = tenantId;
      req.tenantSchema = cached.schema;
      req.tenantPlan = cached.plan;
      next();
      return;
    }

    // Load from DB
    const tenant = await this.knex('tenants')
      .select('id', 'schema_name', 'subscription_plan', 'status')
      .where({ id: tenantId, deleted_at: null })
      .first();

    if (!tenant) {
      next();
      return;
    }

    // Cache the result
    this.cache.set(tenantId, {
      plan: tenant.subscription_plan,
      status: tenant.status,
      schema: tenant.schema_name,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    if (tenant.status !== 'active') {
      res.status(403).json({
        statusCode: 403,
        message: `Tenant account is ${tenant.status}. Please contact support.`,
      });
      return;
    }

    req.tenantId = tenantId;
    req.tenantSchema = tenant.schema_name;
    req.tenantPlan = tenant.subscription_plan;

    next();
  }
}
