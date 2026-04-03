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
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @Inject(KNEX_ADMIN_CONNECTION) private readonly knex: Knex,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      req.tenantId = tenantId;
      req.tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;

      // Load tenant plan from DB for plan enforcement guards
      const tenant = await this.knex('tenants')
        .select('subscription_plan', 'status')
        .where({ id: tenantId, deleted_at: null })
        .first();

      if (tenant) {
        req.tenantPlan = tenant.subscription_plan;

        if (tenant.status !== 'active') {
          _res.status(403).json({
            statusCode: 403,
            message: `Tenant account is ${tenant.status}. Please contact support.`,
          });
          return;
        }
      }
    }

    next();
  }
}
