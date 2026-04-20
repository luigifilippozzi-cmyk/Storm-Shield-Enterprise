import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { StorageService } from '../../common/services/storage.service';
import { generateId } from '@sse/shared-utils';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { ActivationEventsService } from '../admin/activation/activation.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class VehiclesService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly storageService: StorageService,
    private readonly activationEvents: ActivationEventsService,
  ) {}

  async findAll(tenantId: string, query: QueryVehicleDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const { search, customer_id, make, year, condition, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = query;

    const baseQuery = knex('vehicles')
      .where({ 'vehicles.tenant_id': tenantId, 'vehicles.deleted_at': null });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('vehicles.vin', `%${search}%`)
          .orWhereILike('vehicles.make', `%${search}%`)
          .orWhereILike('vehicles.model', `%${search}%`)
          .orWhereILike('vehicles.license_plate', `%${search}%`);
      });
    }

    if (customer_id) {
      baseQuery.where('vehicles.customer_id', customer_id);
    }

    if (make) {
      baseQuery.whereILike('vehicles.make', `%${make}%`);
    }

    if (year) {
      baseQuery.where('vehicles.year', year);
    }

    if (condition) {
      baseQuery.where('vehicles.condition', condition);
    }

    baseQuery.leftJoin('customers', 'vehicles.customer_id', 'customers.id');

    // Count total
    const [{ count }] = await baseQuery.clone().count('vehicles.id as count');
    const total = Number(count);

    // Validate sort column
    const allowedSorts = ['year', 'make', 'model', 'created_at', 'updated_at', 'mileage'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    // Fetch paginated data
    const offset = (page - 1) * limit;
    const data = await baseQuery
      .select(
        'vehicles.*',
        knex.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
      )
      .orderBy(`vehicles.${sortColumn}`, sort_order)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(tenantId: string, dto: CreateVehicleDto) {
    const knex = await this.tenantDb.getConnection();
    const isFirst = !(await knex('vehicles').where({ tenant_id: tenantId, deleted_at: null }).first());
    const [record] = await knex('vehicles')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        ...dto,
      })
      .returning('*');
    if (isFirst) await this.activationEvents.record(tenantId, 'first_vehicle_created');
    return record;
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('vehicles')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!record) throw new NotFoundException('Vehicle not found');

    const photos = await knex('vehicle_photos')
      .where({ vehicle_id: id, tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    return { ...record, photos };
  }

  async uploadPhoto(
    tenantId: string,
    vehicleId: string,
    userId: string,
    file: Express.Multer.File,
    photoType = 'general',
    description?: string,
  ) {
    if (!ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_PHOTO_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_PHOTO_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const knex = await this.tenantDb.getConnection();

    // Verify vehicle exists
    const vehicle = await knex('vehicles')
      .where({ id: vehicleId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const key = this.storageService.generateKey(tenantId, 'vehicles', file.originalname);
    const { url } = await this.storageService.upload(key, file.buffer, file.mimetype);

    const [photo] = await knex('vehicle_photos')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        storage_key: key,
        file_name: file.originalname,
        photo_type: photoType,
        description: description || null,
        uploaded_by: userId,
      })
      .returning('*');

    return { ...photo, url };
  }

  async deletePhoto(tenantId: string, vehicleId: string, photoId: string) {
    const knex = await this.tenantDb.getConnection();

    const photo = await knex('vehicle_photos')
      .where({ id: photoId, vehicle_id: vehicleId, tenant_id: tenantId })
      .first();
    if (!photo) throw new NotFoundException('Photo not found');

    await this.storageService.delete(photo.storage_key);
    await knex('vehicle_photos').where({ id: photoId }).del();

    return { deleted: true };
  }

  async getPhotos(tenantId: string, vehicleId: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('vehicle_photos')
      .where({ vehicle_id: vehicleId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async update(tenantId: string, id: string, dto: UpdateVehicleDto) {
    const knex = await this.tenantDb.getConnection();
    const [record] = await knex('vehicles')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ ...dto, updated_at: new Date() })
      .returning('*');
    if (!record) throw new NotFoundException('Vehicle not found');
    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const updated = await knex('vehicles')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .update({ deleted_at: new Date() });
    if (!updated) throw new NotFoundException('Vehicle not found');
    return { deleted: true };
  }
}
