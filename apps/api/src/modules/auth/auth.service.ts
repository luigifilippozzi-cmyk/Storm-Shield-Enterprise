import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken, createClerkClient, type ClerkClient } from '@clerk/backend';
import { Knex } from 'knex';
import { KNEX_ADMIN_CONNECTION } from '../../config/database.module';

@Injectable()
export class AuthService {
  private clerk: ClerkClient | null = null;
  private secretKey: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(KNEX_ADMIN_CONNECTION) private readonly knex: Knex,
  ) {
    this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY', '');
    if (this.secretKey) {
      this.clerk = createClerkClient({ secretKey: this.secretKey });
    }
  }

  /**
   * Verify a Clerk session token (Bearer token from frontend).
   * Returns the decoded JWT payload with userId, orgId, etc.
   */
  async verifySessionToken(token: string) {
    if (!this.secretKey) {
      throw new UnauthorizedException('Auth not configured');
    }

    try {
      const jwtKey = this.configService.get<string>('CLERK_JWT_KEY', '');
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
        ...(jwtKey ? { jwtKey } : {}),
      });

      return {
        clerkUserId: payload.sub,
        orgId: (payload as any).org_id || null,
        orgRole: (payload as any).org_role || null,
        sessionId: (payload as any).sid || null,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Get full Clerk user profile by Clerk user ID.
   */
  async getClerkUser(clerkUserId: string) {
    if (!this.clerk) return null;
    try {
      return await this.clerk.users.getUser(clerkUserId);
    } catch {
      return null;
    }
  }

  /**
   * Find the tenant a Clerk user belongs to by scanning active tenant schemas.
   * Used by GET /auth/tenant-context to bootstrap frontend tenant resolution
   * when neither orgId nor publicMetadata.tenantId is available in the JWT.
   */
  async getTenantContext(clerkUserId: string): Promise<{
    tenantId: string;
    tenantName: string;
    tenantPlan: string;
  } | null> {
    const tenants = await this.knex('tenants')
      .select('id', 'name', 'subscription_plan', 'schema_name')
      .where({ status: 'active', deleted_at: null });

    for (const tenant of tenants) {
      const user = await this.knex
        .withSchema(tenant.schema_name)
        .table('users')
        .select('id')
        .where({ external_auth_id: clerkUserId, deleted_at: null })
        .first();

      if (user) {
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantPlan: tenant.subscription_plan,
        };
      }
    }

    return null;
  }
}
