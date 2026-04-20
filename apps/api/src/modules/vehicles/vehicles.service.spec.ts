import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { StorageService } from '../../common/services/storage.service';
import { ActivationEventsService } from '../admin/activation/activation.service';

const mockKnex = () => {
  const chain: any = {};
  const methods = [
    'where', 'insert', 'update', 'select', 'first', 'returning',
    'clone', 'count', 'orderBy', 'limit', 'offset', 'del',
    'whereILike', 'orWhereILike', 'leftJoin',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  const knexFn: any = jest.fn().mockReturnValue(chain);
  Object.assign(knexFn, chain);
  knexFn.raw = jest.fn().mockReturnValue('raw_expr');
  knexFn._chain = chain;
  return knexFn;
};

jest.mock('@sse/shared-utils', () => ({
  generateId: () => '00000000-0000-0000-0000-000000000099',
}));

describe('VehiclesService', () => {
  let service: VehiclesService;
  let knex: any;

  const TENANT_ID = '00000000-0000-0000-0000-000000000001';
  const VEHICLE_ID = '00000000-0000-0000-0000-000000000010';
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000020';

  beforeEach(async () => {
    knex = mockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
        { provide: StorageService, useValue: { upload: jest.fn(), delete: jest.fn(), generateKey: jest.fn().mockReturnValue('key') } },
        { provide: ActivationEventsService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();
    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAll', () => {
    it('should return paginated vehicles', async () => {
      const mockVehicles = [{ id: VEHICLE_ID, year: 2023, make: 'Honda', model: 'Civic' }];
      knex._chain.count.mockReturnValueOnce([{ count: '1' }]);
      knex._chain.offset.mockReturnValueOnce(mockVehicles);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockVehicles);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by customer_id', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { customer_id: CUSTOMER_ID, page: 1, limit: 20 });

      expect(knex._chain.where).toHaveBeenCalledWith('vehicles.customer_id', CUSTOMER_ID);
    });

    it('should filter by make', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { make: 'Honda', page: 1, limit: 20 });

      expect(knex._chain.whereILike).toHaveBeenCalledWith('vehicles.make', '%Honda%');
    });

    it('should filter by year', async () => {
      knex._chain.count.mockReturnValueOnce([{ count: '0' }]);
      knex._chain.offset.mockReturnValueOnce([]);

      await service.findAll(TENANT_ID, { year: 2023, page: 1, limit: 20 } as any);

      expect(knex._chain.where).toHaveBeenCalledWith('vehicles.year', 2023);
    });
  });

  describe('create', () => {
    it('should create and return vehicle', async () => {
      const mockVehicle = { id: VEHICLE_ID, year: 2023, make: 'Honda', model: 'Civic' };
      knex._chain.returning.mockReturnValueOnce([mockVehicle]);

      const result = await service.create(TENANT_ID, {
        customer_id: CUSTOMER_ID,
        year: 2023,
        make: 'Honda',
        model: 'Civic',
      } as any);

      expect(result).toEqual(mockVehicle);
      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID, make: 'Honda' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return vehicle with photos', async () => {
      const mockVehicle = { id: VEHICLE_ID, make: 'Honda' };
      const mockPhotos = [{ id: 'photo-1', file_name: 'front.jpg' }];
      knex._chain.first.mockReturnValueOnce(mockVehicle);
      knex._chain.orderBy.mockReturnValueOnce(mockPhotos);

      const result = await service.findOne(TENANT_ID, VEHICLE_ID);

      expect(result).toEqual({ ...mockVehicle, photos: mockPhotos });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(service.findOne(TENANT_ID, VEHICLE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return vehicle', async () => {
      const mockVehicle = { id: VEHICLE_ID, make: 'Toyota' };
      knex._chain.returning.mockReturnValueOnce([mockVehicle]);

      const result = await service.update(TENANT_ID, VEHICLE_ID, { make: 'Toyota' } as any);

      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.returning.mockReturnValueOnce([]);

      await expect(
        service.update(TENANT_ID, VEHICLE_ID, { make: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete vehicle', async () => {
      knex._chain.update.mockReturnValueOnce(1);

      const result = await service.remove(TENANT_ID, VEHICLE_ID);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when not found', async () => {
      knex._chain.update.mockReturnValueOnce(0);

      await expect(service.remove(TENANT_ID, VEHICLE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll — filters', () => {
    const setupPaginated = (data: any[] = []) => {
      knex._chain.count.mockReturnValueOnce([{ count: String(data.length) }]);
      knex._chain.offset.mockReturnValueOnce(data);
    };

    it('should apply search filter', async () => {
      setupPaginated([]);
      await service.findAll(TENANT_ID, { search: 'Honda', page: 1, limit: 20 });
      expect(knex._chain.where).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should apply condition filter', async () => {
      setupPaginated([]);
      await service.findAll(TENANT_ID, { condition: 'good', page: 1, limit: 20 } as any);
      expect(knex._chain.where).toHaveBeenCalledWith('vehicles.condition', 'good');
    });

    it('should use fallback sort column for invalid sort_by', async () => {
      setupPaginated([]);
      await service.findAll(TENANT_ID, { sort_by: 'invalid_col', page: 1, limit: 20 } as any);
      expect(knex._chain.orderBy).toHaveBeenCalledWith('vehicles.created_at', expect.any(String));
    });
  });

  describe('uploadPhoto', () => {
    const makeFile = (mimetype = 'image/jpeg', size = 1024): Express.Multer.File =>
      ({
        mimetype,
        size,
        originalname: 'photo.jpg',
        buffer: Buffer.from('img'),
      } as any);

    let storageService: any;

    beforeEach(async () => {
      storageService = { upload: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/photo.jpg' }), delete: jest.fn(), generateKey: jest.fn().mockReturnValue('key') };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VehiclesService,
          { provide: TenantDatabaseService, useValue: { getConnection: jest.fn().mockResolvedValue(knex) } },
          { provide: StorageService, useValue: storageService },
          { provide: ActivationEventsService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
        ],
      }).compile();
      service = module.get<VehiclesService>(VehiclesService);
    });

    it('should upload a valid photo', async () => {
      const mockVehicle = { id: VEHICLE_ID };
      const mockPhoto = { id: 'photo-1', file_name: 'photo.jpg' };
      knex._chain.first.mockReturnValueOnce(mockVehicle);
      knex._chain.returning.mockReturnValueOnce([mockPhoto]);

      const result = await service.uploadPhoto(TENANT_ID, VEHICLE_ID, 'user-1', makeFile());

      expect(result).toEqual({ ...mockPhoto, url: 'https://cdn.example.com/photo.jpg' });
    });

    it('should reject invalid file type', async () => {
      await expect(
        service.uploadPhoto(TENANT_ID, VEHICLE_ID, 'user-1', makeFile('application/pdf')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file exceeding 10MB', async () => {
      await expect(
        service.uploadPhoto(TENANT_ID, VEHICLE_ID, 'user-1', makeFile('image/jpeg', 11 * 1024 * 1024)),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);
      await expect(
        service.uploadPhoto(TENANT_ID, VEHICLE_ID, 'user-1', makeFile()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should support image/png and image/webp types', async () => {
      for (const type of ['image/png', 'image/webp']) {
        knex._chain.first.mockReturnValueOnce({ id: VEHICLE_ID });
        knex._chain.returning.mockReturnValueOnce([{ id: 'photo-1' }]);
        await expect(
          service.uploadPhoto(TENANT_ID, VEHICLE_ID, 'user-1', makeFile(type)),
        ).resolves.toBeDefined();
      }
    });

    it('should use provided photoType and description', async () => {
      knex._chain.first.mockReturnValueOnce({ id: VEHICLE_ID });
      knex._chain.returning.mockReturnValueOnce([{ id: 'photo-1' }]);

      await service.uploadPhoto(TENANT_ID, VEHICLE_ID, 'user-1', makeFile(), 'damage', 'Front bumper dent');

      expect(knex._chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ photo_type: 'damage', description: 'Front bumper dent' }),
      );
    });
  });

  describe('deletePhoto', () => {
    it('should delete an existing photo', async () => {
      knex._chain.first.mockReturnValueOnce({ id: 'photo-1', storage_key: 'key/photo.jpg' });

      const result = await service.deletePhoto(TENANT_ID, VEHICLE_ID, 'photo-1');

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when photo not found', async () => {
      knex._chain.first.mockReturnValueOnce(null);

      await expect(
        service.deletePhoto(TENANT_ID, VEHICLE_ID, 'photo-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPhotos', () => {
    it('should return photos for a vehicle', async () => {
      const mockPhotos = [{ id: 'photo-1', file_name: 'front.jpg' }];
      knex._chain.orderBy.mockReturnValueOnce(mockPhotos);

      const result = await service.getPhotos(TENANT_ID, VEHICLE_ID);

      expect(result).toEqual(mockPhotos);
    });
  });
});
