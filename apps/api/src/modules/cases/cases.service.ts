import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { generateId } from '@sse/shared-utils';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto, CaseStatus } from './dto/update-case.dto';
import { QueryCaseDto } from './dto/query-case.dto';
import { ResolveCaseDto } from './dto/resolve-case.dto';

// Valid forward-only transitions (RN3 — simple linear flow, not a full state machine)
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CaseStatus.OPEN]: [CaseStatus.IN_PROGRESS, CaseStatus.CLOSED],
  [CaseStatus.IN_PROGRESS]: [CaseStatus.RESOLVED, CaseStatus.CLOSED],
  [CaseStatus.RESOLVED]: [CaseStatus.CLOSED],
  [CaseStatus.CLOSED]: [],
};

@Injectable()
export class CasesService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(tenantId: string, query: QueryCaseDto) {
    const knex = await this.tenantDb.getConnection();
    const { status, priority, case_type, customer_id, assigned_to_user_id, page = 1, limit = 20 } = query;

    const baseQuery = knex('cases').where({ tenant_id: tenantId });

    if (status) baseQuery.where('status', status);
    if (priority) baseQuery.where('priority', priority);
    if (case_type) baseQuery.where('case_type', case_type);
    if (customer_id) baseQuery.where('customer_id', customer_id);
    if (assigned_to_user_id) baseQuery.where('assigned_to_user_id', assigned_to_user_id);

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);
    const offset = (page - 1) * limit;

    const data = await baseQuery
      .select('*')
      .orderBy('created_at', 'desc')
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

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const record = await knex('cases').where({ id, tenant_id: tenantId }).first();
    if (!record) throw new NotFoundException('Case not found');
    return record;
  }

  async create(tenantId: string, userId: string, dto: CreateCaseDto) {
    const knex = await this.tenantDb.getConnection();

    // Explicit field mapping — no spread to prevent mass assignment of server-controlled fields
    const [record] = await knex('cases')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        opened_by_user_id: userId,
        status: CaseStatus.OPEN,
        case_type: dto.case_type,
        title: dto.title,
        body: dto.body,
        priority: dto.priority ?? 'medium',
        customer_id: dto.customer_id ?? null,
        vehicle_id: dto.vehicle_id ?? null,
        related_estimate_id: dto.related_estimate_id ?? null,
        related_so_id: dto.related_so_id ?? null,
        assigned_to_user_id: dto.assigned_to_user_id ?? null,
      })
      .returning('*');

    await this._auditLog(knex, tenantId, record.id, userId, null, CaseStatus.OPEN, 'Case created');
    return record;
  }

  async update(tenantId: string, id: string, userId: string, dto: UpdateCaseDto) {
    const knex = await this.tenantDb.getConnection();
    const existing = await knex('cases').where({ id, tenant_id: tenantId }).first();
    if (!existing) throw new NotFoundException('Case not found');

    if (dto.status && dto.status !== existing.status) {
      this._validateTransition(existing.status, dto.status);
    }

    // Explicit field mapping — no spread to prevent mass assignment
    const updateData: Record<string, any> = { updated_at: new Date() };
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.body !== undefined) updateData.body = dto.body;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assigned_to_user_id !== undefined) updateData.assigned_to_user_id = dto.assigned_to_user_id;

    if (dto.status && dto.status !== existing.status) {
      await this._auditLog(knex, tenantId, id, userId, existing.status, dto.status, null);
    }

    const [record] = await knex('cases')
      .where({ id, tenant_id: tenantId })
      .update(updateData)
      .returning('*');

    return record;
  }

  async resolve(tenantId: string, id: string, userId: string, dto: ResolveCaseDto) {
    const knex = await this.tenantDb.getConnection();
    const existing = await knex('cases').where({ id, tenant_id: tenantId }).first();
    if (!existing) throw new NotFoundException('Case not found');

    this._validateTransition(existing.status, CaseStatus.RESOLVED);

    const [record] = await knex('cases')
      .where({ id, tenant_id: tenantId })
      .update({
        status: CaseStatus.RESOLVED,
        resolved_at: new Date(),
        resolution_notes: dto.resolution_notes ?? null,
        updated_at: new Date(),
      })
      .returning('*');

    await this._auditLog(
      knex, tenantId, id, userId,
      existing.status, CaseStatus.RESOLVED,
      dto.resolution_notes ?? 'Resolved',
    );
    return record;
  }

  async remove(tenantId: string, id: string, userId: string) {
    const knex = await this.tenantDb.getConnection();
    const existing = await knex('cases').where({ id, tenant_id: tenantId }).first();
    if (!existing) throw new NotFoundException('Case not found');

    await knex('cases').where({ id, tenant_id: tenantId }).del();

    await this._auditLog(knex, tenantId, id, userId, existing.status, existing.status, 'Case deleted');
    return { deleted: true };
  }

  // ── Private helpers ──

  private _validateTransition(from: CaseStatus, to: CaseStatus) {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Case status transition ${from} → ${to} is not allowed. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private async _auditLog(
    knex: any,
    tenantId: string,
    caseId: string,
    userId: string,
    fromStatus: CaseStatus | null,
    toStatus: CaseStatus,
    notes: string | null,
  ) {
    await knex('audit_logs')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        user_id: userId,
        action: 'UPDATE',
        resource_type: 'case',
        resource_id: caseId,
        old_values: fromStatus ? { status: fromStatus } : null,
        new_values: { status: toStatus, notes },
        created_at: new Date(),
      })
      .catch((err: Error) => {
        console.error('[CasesService] audit_log failed:', err.message);
      });
  }
}
