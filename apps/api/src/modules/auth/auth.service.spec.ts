import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

const mockVerifyToken = jest.fn();
const mockCreateClerkClient = jest.fn();

jest.mock('@clerk/backend', () => ({
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
  createClerkClient: (...args: any[]) => mockCreateClerkClient(...args),
}));

describe('AuthService', () => {
  const CLERK_SECRET = 'sk_test_secret_key';
  const CLERK_JWT_KEY = 'jwt_test_key';

  describe('with configured secret key', () => {
    let service: AuthService;
    let mockClerk: any;

    beforeEach(async () => {
      mockVerifyToken.mockReset();
      mockCreateClerkClient.mockReset();

      mockClerk = {
        users: { getUser: jest.fn() },
      };
      mockCreateClerkClient.mockReturnValue(mockClerk);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultVal?: string) => {
                if (key === 'CLERK_SECRET_KEY') return CLERK_SECRET;
                if (key === 'CLERK_JWT_KEY') return CLERK_JWT_KEY;
                return defaultVal;
              }),
            },
          },
        ],
      }).compile();
      service = module.get<AuthService>(AuthService);
    });

    describe('verifySessionToken', () => {
      it('should return decoded payload on valid token', async () => {
        const mockPayload = {
          sub: 'user_abc123',
          org_id: 'org_xyz',
          org_role: 'admin',
          sid: 'sess_123',
        };
        mockVerifyToken.mockResolvedValueOnce(mockPayload);

        const result = await service.verifySessionToken('valid-token');

        expect(result).toEqual({
          clerkUserId: 'user_abc123',
          orgId: 'org_xyz',
          orgRole: 'admin',
          sessionId: 'sess_123',
        });
        expect(mockVerifyToken).toHaveBeenCalledWith('valid-token', {
          secretKey: CLERK_SECRET,
          jwtKey: CLERK_JWT_KEY,
        });
      });

      it('should handle payload without org fields', async () => {
        const mockPayload = { sub: 'user_abc123' };
        mockVerifyToken.mockResolvedValueOnce(mockPayload);

        const result = await service.verifySessionToken('valid-token');

        expect(result).toEqual({
          clerkUserId: 'user_abc123',
          orgId: null,
          orgRole: null,
          sessionId: null,
        });
      });

      it('should throw UnauthorizedException on invalid token', async () => {
        mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));

        await expect(service.verifySessionToken('bad-token')).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('getClerkUser', () => {
      it('should return user profile when found', async () => {
        const mockUser = { id: 'user_abc', email: 'test@example.com' };
        mockClerk.users.getUser.mockResolvedValueOnce(mockUser);

        const result = await service.getClerkUser('user_abc');

        expect(result).toEqual(mockUser);
        expect(mockClerk.users.getUser).toHaveBeenCalledWith('user_abc');
      });

      it('should return null when user not found', async () => {
        mockClerk.users.getUser.mockRejectedValueOnce(new Error('Not found'));

        const result = await service.getClerkUser('user_nonexistent');

        expect(result).toBeNull();
      });
    });
  });

  describe('without configured secret key', () => {
    let service: AuthService;

    beforeEach(async () => {
      mockVerifyToken.mockReset();
      mockCreateClerkClient.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((_key: string, defaultVal?: string) => defaultVal || ''),
            },
          },
        ],
      }).compile();
      service = module.get<AuthService>(AuthService);
    });

    it('should throw UnauthorizedException when auth not configured', async () => {
      await expect(service.verifySessionToken('any-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return null for getClerkUser when clerk not initialized', async () => {
      const result = await service.getClerkUser('user_abc');

      expect(result).toBeNull();
    });
  });

  describe('without JWT key', () => {
    let service: AuthService;

    beforeEach(async () => {
      mockVerifyToken.mockReset();
      mockCreateClerkClient.mockReset();
      mockCreateClerkClient.mockReturnValue({ users: { getUser: jest.fn() } });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultVal?: string) => {
                if (key === 'CLERK_SECRET_KEY') return CLERK_SECRET;
                return defaultVal || '';
              }),
            },
          },
        ],
      }).compile();
      service = module.get<AuthService>(AuthService);
    });

    it('should call verifyToken without jwtKey when not configured', async () => {
      const mockPayload = { sub: 'user_abc' };
      mockVerifyToken.mockResolvedValueOnce(mockPayload);

      await service.verifySessionToken('token');

      expect(mockVerifyToken).toHaveBeenCalledWith('token', {
        secretKey: CLERK_SECRET,
      });
    });
  });
});
