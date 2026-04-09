import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: any) => {
              const config: Record<string, any> = {
                STORAGE_PROVIDER: 's3',
                S3_BUCKET_NAME: '', // empty = mock mode
                S3_PUBLIC_URL_BASE: '',
              };
              return config[key] ?? defaultVal;
            }),
          },
        },
      ],
    }).compile();
    service = module.get<StorageService>(StorageService);
  });

  describe('generateKey', () => {
    it('should generate a key with tenant, entity, and sanitized filename', () => {
      const key = service.generateKey('tenant-123', 'vehicles', 'my photo.jpg');
      expect(key).toBe('tenant-123/vehicles/00000000-0000-0000-0000-000000000099-my_photo.jpg');
    });

    it('should sanitize special characters in filename', () => {
      const key = service.generateKey('t1', 'vehicles', 'image (1) [test].png');
      expect(key).toContain('image__1___test_.png');
    });
  });

  describe('upload (mock mode)', () => {
    it('should return mock URL when S3 not configured', async () => {
      const result = await service.upload('test-key', Buffer.from('data'), 'image/jpeg');
      expect(result.url).toContain('mock-storage.local');
      expect(result.key).toBe('test-key');
    });
  });

  describe('delete (mock mode)', () => {
    it('should not throw when S3 not configured', async () => {
      await expect(service.delete('test-key')).resolves.toBeUndefined();
    });
  });

  describe('getSignedUrl (mock mode)', () => {
    it('should return mock signed URL', async () => {
      const url = await service.getSignedUrl('test-key');
      expect(url).toContain('mock-storage.local');
      expect(url).toContain('signed=true');
    });
  });
});
