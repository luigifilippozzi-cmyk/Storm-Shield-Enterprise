import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Subscription plan limits per feature.
 * Each plan defines max counts for key resources.
 * `null` = unlimited.
 */
export const PLAN_LIMITS: Record<string, Record<string, number | null>> = {
  free: {
    customers: 50,
    vehicles: 50,
    estimates: 25,
    service_orders: 25,
    users: 3,
    storage_mb: 500,
  },
  starter: {
    customers: 500,
    vehicles: 500,
    estimates: 250,
    service_orders: 250,
    users: 10,
    storage_mb: 5000,
  },
  pro: {
    customers: null,
    vehicles: null,
    estimates: null,
    service_orders: null,
    users: 50,
    storage_mb: 50000,
  },
  enterprise: {
    customers: null,
    vehicles: null,
    estimates: null,
    service_orders: null,
    users: null,
    storage_mb: null,
  },
};

/**
 * Features gated by plan. Each plan lists which modules are accessible.
 */
export const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    'customers', 'vehicles', 'estimates', 'service-orders', 'financial',
  ],
  starter: [
    'customers', 'vehicles', 'estimates', 'service-orders', 'financial',
    'insurance', 'contractors', 'reports',
  ],
  pro: [
    'customers', 'vehicles', 'estimates', 'service-orders', 'financial',
    'insurance', 'contractors', 'reports', 'accounting', 'fixed-assets',
    'inventory', 'notifications',
  ],
  enterprise: [
    'customers', 'vehicles', 'estimates', 'service-orders', 'financial',
    'insurance', 'contractors', 'reports', 'accounting', 'fixed-assets',
    'inventory', 'notifications', 'rental', 'api-access', 'integrations',
  ],
};

export const PLAN_REQUIRED_KEY = 'plan_feature';

/**
 * Decorator to mark an endpoint as requiring a specific plan feature.
 * Usage: @RequirePlanFeature('accounting')
 */
export const RequirePlanFeature = (feature: string) =>
  (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    const reflector = new Reflector();
    Reflect.defineMetadata(PLAN_REQUIRED_KEY, feature, descriptor?.value ?? target);
    return descriptor ?? target;
  };

/**
 * Guard that checks if the current tenant's subscription plan
 * includes the required feature. Must run AFTER TenantMiddleware
 * populates req.tenantPlan.
 */
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.get<string>(
      PLAN_REQUIRED_KEY,
      context.getHandler(),
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const plan = request.tenantPlan || 'free';
    const allowedFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES['free'];

    if (!allowedFeatures.includes(requiredFeature)) {
      throw new ForbiddenException(
        `Feature "${requiredFeature}" requires a higher subscription plan. ` +
        `Current plan: ${plan}. Please upgrade to access this feature.`,
      );
    }

    return true;
  }
}
