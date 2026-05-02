import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { SuperUserService } from '../services/super-user.service';

@Injectable()
export class SuperUserGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly superUserService: SuperUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.clerkUserId) {
      throw new ForbiddenException('Authentication required for platform admin access');
    }

    if (!this.superUserService.isConfigured()) {
      throw new ForbiddenException('Platform admin not configured');
    }

    const clerkUser = await this.authService.getClerkUser(user.clerkUserId);
    const primaryEmailObj = clerkUser?.emailAddresses?.find(
      (e: any) => e.id === clerkUser.primaryEmailAddressId,
    );
    const email = primaryEmailObj?.emailAddress ?? null;

    if (!email || !this.superUserService.isSuperUser(email)) {
      throw new ForbiddenException('Super user access required');
    }

    request.isSuperUser = true;
    request.superUserEmail = email;
    return true;
  }
}
