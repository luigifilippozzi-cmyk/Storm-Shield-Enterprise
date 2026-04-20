import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Knex } from 'knex';
import { AuthService } from '../../modules/auth/auth.service';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.module';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    @Inject(KNEX_ADMIN_CONNECTION) private readonly knex: Knex,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.substring(7);
    const decoded = await this.authService.verifySessionToken(token);

    // Look up the internal user by Clerk external_auth_id
    // The tenant context should already be set by TenantMiddleware
    const tenantId = request.tenantId;
    if (tenantId) {
      const user = await this.knex('users')
        .select('id', 'tenant_id', 'email', 'first_name', 'last_name', 'status')
        .where({ external_auth_id: decoded.clerkUserId, tenant_id: tenantId, deleted_at: null })
        .first();

      if (user) {
        // Load user roles and permissions — always scope by tenant_id to prevent
        // cross-tenant data leakage when using the admin connection (no RLS).
        const [permissions, roleAssignments] = await Promise.all([
          this.knex('role_permissions')
            .select('role_permissions.module', 'role_permissions.action', 'role_permissions.resource')
            .join('roles', 'roles.id', 'role_permissions.role_id')
            .join('user_role_assignments', 'user_role_assignments.role_id', 'role_permissions.role_id')
            .where('user_role_assignments.user_id', user.id)
            .andWhere('roles.tenant_id', tenantId),
          this.knex('roles')
            .select('roles.name')
            .join('user_role_assignments', 'user_role_assignments.role_id', 'roles.id')
            .where('user_role_assignments.user_id', user.id)
            .andWhere('roles.tenant_id', tenantId),
        ]);

        request.user = {
          ...user,
          clerkUserId: decoded.clerkUserId,
          roles: roleAssignments.map((r: { name: string }) => r.name),
          permissions: permissions.map(p => `${p.module}:${p.action}:${p.resource}`),
        };
      } else {
        // User authenticated via Clerk but not found in this tenant
        // This could be a new user that needs to be provisioned
        request.user = {
          clerkUserId: decoded.clerkUserId,
          orgId: decoded.orgId,
          permissions: [],
          isNewUser: true,
        };
      }
    } else {
      request.user = {
        clerkUserId: decoded.clerkUserId,
        orgId: decoded.orgId,
        permissions: [],
      };
    }

    return true;
  }
}
