import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDatabaseService } from '../../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateConsentDto } from './dto/create-consent.dto';

@Injectable()
export class ConsentService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async create(tenantId: string, customerId: string, userId: string, dto: CreateConsentDto) {
    const knex = await this.tenantDb.getConnection();

    const customer = await knex('customers')
      .where({ id: customerId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!customer) throw new NotFoundException('Customer not found');

    const [record] = await knex('customer_consent_records')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        customer_id: customerId,
        consent_type: dto.consent_type,
        granted_at: dto.granted_at || new Date(),
        consent_text: dto.consent_text || null,
        version: dto.version || null,
        created_by: userId,
      })
      .returning('*');

    return record;
  }

  async findByCustomer(tenantId: string, customerId: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('customer_consent_records')
      .where({ customer_id: customerId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async revoke(tenantId: string, customerId: string, consentId: string, userId: string) {
    const knex = await this.tenantDb.getConnection();

    const record = await knex('customer_consent_records')
      .where({ id: consentId, customer_id: customerId, tenant_id: tenantId })
      .whereNull('revoked_at')
      .first();
    if (!record) throw new NotFoundException('Active consent record not found');

    const [updated] = await knex('customer_consent_records')
      .where({ id: consentId })
      .update({
        revoked_at: new Date(),
        revoked_by: userId,
      })
      .returning('*');

    return updated;
  }
}
