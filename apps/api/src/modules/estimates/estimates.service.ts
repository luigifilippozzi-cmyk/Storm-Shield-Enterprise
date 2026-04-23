import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { EstimateStatus } from '@sse/shared-types';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { StorageService } from '../../common/services/storage.service';
import { generateId } from '@sse/shared-utils';
import { CreateEstimateDto, CreateEstimateLineDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { QueryEstimateDto } from './dto/query-estimate.dto';
import { UpdateEstimateStatusDto } from './dto/update-status.dto';
import { CreateSupplementDto } from './dto/create-supplement.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ActivationEventsService } from '../admin/activation/activation.service';
import { EstimateStateMachineService } from './estimate-state-machine.service';

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Legacy updateStatus — now delegates logic to EstimateStateMachineService (RF-005a).
// Retained for backward compat; routes should prefer EstimateStateMachineService.transition().
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted_to_adjuster'],
  submitted_to_adjuster: ['awaiting_approval', 'rejected'],
  awaiting_approval: ['approved', 'supplement_pending', 'rejected', 'disputed'],
  approved: ['approved_with_supplement', 'paid', 'disputed', 'closed'],
  supplement_pending: ['awaiting_approval'],
  approved_with_supplement: ['paid', 'disputed', 'closed'],
  rejected: ['draft'],
  disputed: ['awaiting_approval', 'paid', 'closed'],
  paid: ['closed'],
  closed: [],
};

@Injectable()
export class EstimatesService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly storageService: StorageService,
    private readonly activationEvents: ActivationEventsService,
    private readonly stateMachine: EstimateStateMachineService,
  ) {}

  async findAll(
    tenantId: string,
    query: QueryEstimateDto,
    user?: { id?: string; roles?: string[] },
  ): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const {
      search, status, statuses, insurance_company_id, scope,
      customer_id, vehicle_id, date_from, date_to,
      page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc',
    } = query;

    const baseQuery = knex('estimates')
      .where({ 'estimates.tenant_id': tenantId, 'estimates.deleted_at': null });

    // Ownership enforcement (RN5): estimator role always scoped to own estimates.
    // Guard: estimator without a resolved user.id would leak all tenant estimates — reject hard.
    const isEstimator = user?.roles?.includes('estimator') ?? false;
    if (isEstimator) {
      if (!user?.id) throw new ForbiddenException('Estimator context requires a resolved user identity');
      baseQuery.where('estimates.estimated_by', user.id);
    } else if (scope === 'mine' && user?.id) {
      baseQuery.where('estimates.estimated_by', user.id);
    }

    if (search) {
      baseQuery.where(function () {
        this.whereILike('estimates.estimate_number', `%${search}%`)
          .orWhereILike('estimates.claim_number', `%${search}%`)
          .orWhereILike('customers.first_name', `%${search}%`)
          .orWhereILike('customers.last_name', `%${search}%`);
      });
    }

    // Single status filter (backward compat)
    if (status) {
      baseQuery.where('estimates.status', status);
    }

    // Multi-status filter (comma-separated — takes precedence over single status).
    // Each value is validated against EstimateStatus enum to prevent arbitrary strings reaching DB.
    if (statuses) {
      const validStatuses = Object.values(EstimateStatus);
      const statusList = statuses
        .split(',')
        .map((s) => s.trim())
        .filter((s) => validStatuses.includes(s as EstimateStatus));
      if (statusList.length > 0) {
        baseQuery.whereIn('estimates.status', statusList);
      }
    }

    if (insurance_company_id) {
      baseQuery.where('estimates.insurance_company_id', insurance_company_id);
    }

    if (customer_id) {
      baseQuery.where('estimates.customer_id', customer_id);
    }

    if (vehicle_id) {
      baseQuery.where('estimates.vehicle_id', vehicle_id);
    }

    if (date_from) {
      baseQuery.where('estimates.created_at', '>=', date_from);
    }

    if (date_to) {
      baseQuery.where('estimates.created_at', '<=', date_to);
    }

    baseQuery.leftJoin('customers', 'estimates.customer_id', 'customers.id');

    const [{ count }] = await baseQuery.clone().count('estimates.id as count');
    const total = Number(count);

    const allowedSorts = ['estimate_number', 'total', 'status', 'created_at', 'updated_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .select(
        'estimates.*',
        knex.raw("customers.first_name || ' ' || customers.last_name as customer_name"),
      )
      .leftJoin('vehicles', 'estimates.vehicle_id', 'vehicles.id')
      .leftJoin('insurance_companies', 'estimates.insurance_company_id', 'insurance_companies.id')
      .select(
        knex.raw("vehicles.year || ' ' || vehicles.make || ' ' || vehicles.model as vehicle_description"),
        'insurance_companies.name as insurance_company_name',
      )
      .orderBy(`estimates.${sortColumn}`, sort_order)
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

  async create(tenantId: string, dto: CreateEstimateDto) {
    const knex = await this.tenantDb.getConnection();
    const { lines, ...estimateData } = dto;
    const isFirst = !(await knex('estimates').where({ tenant_id: tenantId, deleted_at: null }).first());

    return knex.transaction(async (trx) => {
      let subtotal = 0;
      if (lines && lines.length > 0) {
        subtotal = lines.reduce((sum: number, line: CreateEstimateLineDto) => sum + line.quantity * line.unit_price, 0);
      }
      const taxAmount = 0;
      const total = subtotal + taxAmount;

      const [estimate] = await trx('estimates')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          ...estimateData,
          status: 'draft',
          subtotal,
          tax_amount: taxAmount,
          total,
        })
        .returning('*');

      if (lines && lines.length > 0) {
        const lineRecords = lines.map((line: CreateEstimateLineDto) => ({
          id: generateId(),
          tenant_id: tenantId,
          estimate_id: estimate.id,
          ...line,
          total: line.quantity * line.unit_price,
        }));
        await trx('estimate_lines').insert(lineRecords);
      }

      if (isFirst) await this.activationEvents.record(tenantId, 'first_estimate_created');
      return estimate;
    });
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const estimate = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    const lines = await knex('estimate_lines')
      .where({ estimate_id: id, tenant_id: tenantId })
      .orderBy('sort_order', 'asc');

    const supplements = await knex('estimate_supplements')
      .where({ estimate_id: id, tenant_id: tenantId })
      .orderBy('supplement_number', 'asc');

    const documents = await knex('estimate_documents')
      .where({ estimate_id: id, tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    return { ...estimate, lines, supplements, documents };
  }

  async update(tenantId: string, id: string, dto: UpdateEstimateDto) {
    const knex = await this.tenantDb.getConnection();

    const existing = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!existing) throw new NotFoundException('Estimate not found');

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft estimates can be edited');
    }

    const { lines, ...estimateData } = dto;

    return knex.transaction(async (trx) => {
      const updateFields: Record<string, unknown> = { ...estimateData, updated_at: new Date() };

      if (lines && lines.length > 0) {
        const subtotal = lines.reduce((sum: number, line: CreateEstimateLineDto) => sum + line.quantity * line.unit_price, 0);
        updateFields.subtotal = subtotal;
        updateFields.tax_amount = 0;
        updateFields.total = subtotal;

        await trx('estimate_lines').where({ estimate_id: id, tenant_id: tenantId }).del();
        const lineRecords = lines.map((line: CreateEstimateLineDto) => ({
          id: generateId(),
          tenant_id: tenantId,
          estimate_id: id,
          ...line,
          total: line.quantity * line.unit_price,
        }));
        await trx('estimate_lines').insert(lineRecords);
      }

      const [record] = await trx('estimates')
        .where({ id, tenant_id: tenantId })
        .update(updateFields)
        .returning('*');

      return record;
    });
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateEstimateStatusDto) {
    const knex = await this.tenantDb.getConnection();
    const estimate = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    const allowed = ALLOWED_STATUS_TRANSITIONS[estimate.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${estimate.status}' to '${dto.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateFields: Record<string, unknown> = { status: dto.status, updated_at: new Date() };
    if (dto.status === 'approved') {
      updateFields.approved_at = new Date();
    }

    const [record] = await knex('estimates')
      .where({ id, tenant_id: tenantId })
      .update(updateFields)
      .returning('*');

    return record;
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const estimate = await knex('estimates')
      .where({ id, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    if (estimate.status !== 'draft') {
      throw new BadRequestException('Only draft estimates can be deleted');
    }

    await knex('estimates')
      .where({ id, tenant_id: tenantId })
      .update({ deleted_at: new Date() });
    return { deleted: true };
  }

  // ── Document Upload ──

  async attachDocument(
    tenantId: string,
    estimateId: string,
    userId: string,
    file: Express.Multer.File,
    documentType = 'other',
  ) {
    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: PDF, images, Word documents`,
      );
    }
    if (file.size > MAX_DOC_SIZE) {
      throw new BadRequestException('File size exceeds 25MB limit');
    }

    const knex = await this.tenantDb.getConnection();

    const estimate = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    const key = this.storageService.generateKey(tenantId, 'estimates', file.originalname);
    await this.storageService.upload(key, file.buffer, file.mimetype);

    const [doc] = await knex('estimate_documents')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        estimate_id: estimateId,
        storage_key: key,
        file_name: file.originalname,
        document_type: documentType,
        uploaded_by: userId,
      })
      .returning('*');

    return doc;
  }

  async deleteDocument(tenantId: string, estimateId: string, documentId: string) {
    const knex = await this.tenantDb.getConnection();

    const doc = await knex('estimate_documents')
      .where({ id: documentId, estimate_id: estimateId, tenant_id: tenantId })
      .first();
    if (!doc) throw new NotFoundException('Document not found');

    await this.storageService.delete(doc.storage_key);
    await knex('estimate_documents').where({ id: documentId }).del();

    return { deleted: true };
  }

  async getDocuments(tenantId: string, estimateId: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('estimate_documents')
      .where({ estimate_id: estimateId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  // ── Supplements ──

  async getSupplements(tenantId: string, estimateId: string) {
    const knex = await this.tenantDb.getConnection();
    return knex('estimate_supplements')
      .where({ estimate_id: estimateId, tenant_id: tenantId })
      .orderBy('supplement_number', 'asc');
  }

  async createSupplement(tenantId: string, estimateId: string, userId: string, dto: CreateSupplementDto) {
    const knex = await this.tenantDb.getConnection();

    const estimate = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    // Get next supplement number
    const [{ count }] = await knex('estimate_supplements')
      .where({ estimate_id: estimateId, tenant_id: tenantId })
      .count('id as count');
    const supplementNumber = Number(count) + 1;

    const [record] = await knex('estimate_supplements')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        estimate_id: estimateId,
        supplement_number: supplementNumber,
        reason: dto.reason,
        amount: dto.amount,
        status: 'draft',
        requested_by: userId,
      })
      .returning('*');

    return record;
  }

  // ── RF-006: Dispute workflow ──

  async openDispute(tenantId: string, estimateId: string, dto: OpenDisputeDto, userId: string) {
    const knex = await this.tenantDb.getConnection();

    const estimate = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    if (estimate.status === 'disputed') {
      throw new ConflictException('Estimate is already in disputed status');
    }

    // Delegate to state machine — throws BadRequestException if transition not allowed
    await this.stateMachine.transition(tenantId, estimateId, 'disputed', userId, dto.dispute_notes);

    const now = new Date();
    const [updated] = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId })
      .update({
        dispute_reason: dto.dispute_reason,
        dispute_notes: dto.dispute_notes ?? null,
        dispute_opened_at: now,
        dispute_resolved_at: null,
        updated_at: now,
      })
      .returning('*');

    // Pause all active service orders linked to this estimate
    await knex('service_orders')
      .where({ estimate_id: estimateId, tenant_id: tenantId, deleted_at: null })
      .whereNotIn('status', ['completed', 'delivered', 'cancelled'])
      .update({ is_paused_by_dispute: true, updated_at: now });

    // Notify all owner-role users for this tenant
    await this.notifyOwners(tenantId, knex, {
      type: 'warning',
      title: `Estimate ${estimate.estimate_number} Disputed`,
      message: `Estimate ${estimate.estimate_number} has been moved to disputed status. Reason: ${dto.dispute_reason.replace(/_/g, ' ')}. Linked service orders are paused.`,
      data: { estimate_id: estimateId, dispute_reason: dto.dispute_reason },
    });

    return updated;
  }

  async resolveDispute(tenantId: string, estimateId: string, dto: ResolveDisputeDto, userId: string) {
    const knex = await this.tenantDb.getConnection();

    const estimate = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!estimate) throw new NotFoundException('Estimate not found');

    if (estimate.status !== 'disputed') {
      throw new BadRequestException(`Cannot resolve dispute: estimate is in '${estimate.status}' status, expected 'disputed'`);
    }

    // Delegate status transition to state machine — validates allowed targets
    await this.stateMachine.transition(tenantId, estimateId, dto.resolution_status, userId, dto.notes);

    const now = new Date();
    const [updated] = await knex('estimates')
      .where({ id: estimateId, tenant_id: tenantId })
      .update({ dispute_resolved_at: now, updated_at: now })
      .returning('*');

    // Unpause all service orders linked to this estimate
    await knex('service_orders')
      .where({ estimate_id: estimateId, tenant_id: tenantId, is_paused_by_dispute: true })
      .update({ is_paused_by_dispute: false, updated_at: now });

    return updated;
  }

  private async notifyOwners(
    tenantId: string,
    knex: any,
    payload: { type: string; title: string; message: string; data: Record<string, unknown> },
  ) {
    const ownerUsers = await knex('user_role_assignments')
      .join('roles', 'user_role_assignments.role_id', 'roles.id')
      .where({ 'user_role_assignments.tenant_id': tenantId, 'roles.name': 'owner' })
      .select('user_role_assignments.user_id');

    if (!ownerUsers.length) return;

    const notifications = ownerUsers.map((u: { user_id: string }) => ({
      id: generateId(),
      tenant_id: tenantId,
      user_id: u.user_id,
      type: payload.type,
      channel: 'in_app',
      title: payload.title,
      message: payload.message,
      data: JSON.stringify(payload.data),
    }));

    await knex('notifications').insert(notifications);
  }
}
