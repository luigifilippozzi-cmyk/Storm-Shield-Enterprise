import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../config/database.module';
import { PLAN_LIMITS } from '../guards/plan.guard';

/**
 * Resource-to-table mapping for counting records per tenant.
 */
const RESOURCE_TABLE_MAP: Record<string, string> = {
  customers: 'customers',
  vehicles: 'vehicles',
  estimates: 'estimates',
  service_orders: 'service_orders',
  users: 'users',
};

/**
 * Interceptor that enforces plan resource limits on POST (create) requests.
 * Checks the current count of resources against the plan limit before allowing creation.
 *
 * Apply to controllers that create resources:
 *   @UseInterceptors(PlanLimitsInterceptor)
 */
@Injectable()
export class PlanLimitsInterceptor implements NestInterceptor {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    if (request.method !== 'POST') {
      return next.handle();
    }

    const tenantId = request.tenantId;
    const plan = request.tenantPlan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free'];

    // Determine which resource is being created from the URL path
    const pathSegments = request.path.split('/').filter(Boolean);
    const resourceSegment = pathSegments[pathSegments.length - 1];
    const resourceKey = resourceSegment?.replace(/-/g, '_');
    const tableName = RESOURCE_TABLE_MAP[resourceKey];

    if (!tableName || !tenantId) {
      return next.handle();
    }

    const limit = limits[resourceKey];
    if (limit === null || limit === undefined) {
      return next.handle();
    }

    const [{ count }] = await this.knex(tableName)
      .where({ tenant_id: tenantId, deleted_at: null })
      .count('id as count');

    if (Number(count) >= limit) {
      throw new ForbiddenException(
        `Plan limit reached: your "${plan}" plan allows up to ${limit} ${resourceKey}. ` +
        `Please upgrade your plan to add more.`,
      );
    }

    return next.handle();
  }
}
