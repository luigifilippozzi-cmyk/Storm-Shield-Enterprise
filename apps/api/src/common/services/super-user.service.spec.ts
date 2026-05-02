import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SuperUserService } from './super-user.service';

function makeService(env: Record<string, string>): SuperUserService {
  const configService = {
    get: (key: string, defaultVal = '') => env[key] ?? defaultVal,
  } as unknown as ConfigService;
  return new SuperUserService(configService);
}

describe('SuperUserService', () => {
  describe('isSuperUser', () => {
    it('returns true for exact primary email match', () => {
      const svc = makeService({ SUPER_USER_EMAIL: 'admin@example.com' });
      expect(svc.isSuperUser('admin@example.com')).toBe(true);
    });

    it('is case-insensitive for primary email', () => {
      const svc = makeService({ SUPER_USER_EMAIL: 'Admin@Example.COM' });
      expect(svc.isSuperUser('admin@example.com')).toBe(true);
      expect(svc.isSuperUser('ADMIN@EXAMPLE.COM')).toBe(true);
    });

    it('returns false for non-matching email', () => {
      const svc = makeService({ SUPER_USER_EMAIL: 'admin@example.com' });
      expect(svc.isSuperUser('other@example.com')).toBe(false);
    });

    it('returns false when SUPER_USER_EMAIL is not configured', () => {
      const svc = makeService({});
      expect(svc.isSuperUser('admin@example.com')).toBe(false);
    });

    it('returns false for empty email', () => {
      const svc = makeService({ SUPER_USER_EMAIL: 'admin@example.com' });
      expect(svc.isSuperUser('')).toBe(false);
    });

    it('returns false for backup email when SUPER_USER_BACKUP_ACTIVE=false', () => {
      const svc = makeService({
        SUPER_USER_EMAIL: 'primary@example.com',
        SUPER_USER_BACKUP_EMAIL: 'backup@example.com',
        SUPER_USER_BACKUP_ACTIVE: 'false',
      });
      expect(svc.isSuperUser('backup@example.com')).toBe(false);
    });

    it('returns true for backup email when SUPER_USER_BACKUP_ACTIVE=true', () => {
      const svc = makeService({
        SUPER_USER_EMAIL: 'primary@example.com',
        SUPER_USER_BACKUP_EMAIL: 'backup@example.com',
        SUPER_USER_BACKUP_ACTIVE: 'true',
      });
      expect(svc.isSuperUser('backup@example.com')).toBe(true);
    });

    it('primary email still works when backup is active', () => {
      const svc = makeService({
        SUPER_USER_EMAIL: 'primary@example.com',
        SUPER_USER_BACKUP_EMAIL: 'backup@example.com',
        SUPER_USER_BACKUP_ACTIVE: 'true',
      });
      expect(svc.isSuperUser('primary@example.com')).toBe(true);
    });

    it('returns false for backup email when SUPER_USER_BACKUP_EMAIL is not set', () => {
      const svc = makeService({
        SUPER_USER_EMAIL: 'primary@example.com',
        SUPER_USER_BACKUP_ACTIVE: 'true',
      });
      expect(svc.isSuperUser('')).toBe(false);
    });
  });

  describe('isConfigured', () => {
    it('returns true when SUPER_USER_EMAIL is set', () => {
      const svc = makeService({ SUPER_USER_EMAIL: 'admin@example.com' });
      expect(svc.isConfigured()).toBe(true);
    });

    it('returns false when SUPER_USER_EMAIL is empty', () => {
      const svc = makeService({ SUPER_USER_EMAIL: '' });
      expect(svc.isConfigured()).toBe(false);
    });

    it('returns false when SUPER_USER_EMAIL is not set', () => {
      const svc = makeService({});
      expect(svc.isConfigured()).toBe(false);
    });
  });

  it('should be defined via DI', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperUserService,
        {
          provide: ConfigService,
          useValue: { get: () => '' },
        },
      ],
    }).compile();
    expect(module.get<SuperUserService>(SuperUserService)).toBeDefined();
  });
});
