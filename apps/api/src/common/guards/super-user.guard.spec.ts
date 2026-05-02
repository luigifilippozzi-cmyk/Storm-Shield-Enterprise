import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuperUserGuard } from './super-user.guard';
import { SuperUserService } from '../services/super-user.service';
import { AuthService } from '../../modules/auth/auth.service';

function makeContext(user: any): ExecutionContext {
  const req: any = { user, isSuperUser: undefined, superUserEmail: undefined };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as any;
}

const mockAuthService = {
  getClerkUser: jest.fn(),
} as unknown as AuthService;

const mockSuperUserService = {
  isSuperUser: jest.fn(),
  isConfigured: jest.fn(),
} as unknown as SuperUserService;

beforeEach(() => jest.clearAllMocks());

describe('SuperUserGuard', () => {
  let guard: SuperUserGuard;

  beforeEach(() => {
    guard = new SuperUserGuard(mockAuthService, mockSuperUserService);
  });

  it('throws ForbiddenException when no user in request', async () => {
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when user has no clerkUserId', async () => {
    const ctx = makeContext({ id: 'some-db-id' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when super user is not configured', async () => {
    (mockSuperUserService.isConfigured as jest.Mock).mockReturnValue(false);
    const ctx = makeContext({ clerkUserId: 'clerk_abc' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when Clerk user has no email matching super user', async () => {
    (mockSuperUserService.isConfigured as jest.Mock).mockReturnValue(true);
    (mockAuthService.getClerkUser as jest.Mock).mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'other@example.com' }],
    });
    (mockSuperUserService.isSuperUser as jest.Mock).mockReturnValue(false);

    const ctx = makeContext({ clerkUserId: 'clerk_abc' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when Clerk user is null', async () => {
    (mockSuperUserService.isConfigured as jest.Mock).mockReturnValue(true);
    (mockAuthService.getClerkUser as jest.Mock).mockResolvedValue(null);
    (mockSuperUserService.isSuperUser as jest.Mock).mockReturnValue(false);

    const ctx = makeContext({ clerkUserId: 'clerk_abc' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sets isSuperUser=true and returns true for valid super user', async () => {
    (mockSuperUserService.isConfigured as jest.Mock).mockReturnValue(true);
    (mockAuthService.getClerkUser as jest.Mock).mockResolvedValue({
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'admin@example.com' }],
    });
    (mockSuperUserService.isSuperUser as jest.Mock).mockReturnValue(true);

    const ctx = makeContext({ clerkUserId: 'clerk_abc' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const req = (ctx as any)._req;
    expect(req.isSuperUser).toBe(true);
    expect(req.superUserEmail).toBe('admin@example.com');
  });
});
