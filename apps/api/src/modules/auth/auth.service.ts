import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken, createClerkClient, type ClerkClient } from '@clerk/backend';

@Injectable()
export class AuthService {
  private clerk: ClerkClient | null = null;
  private secretKey: string;

  constructor(private readonly configService: ConfigService) {
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
}
