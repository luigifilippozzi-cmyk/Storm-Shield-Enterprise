import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../../config/tenant-database.service';
import { FiscalPeriodsService } from '../fiscal-periods/fiscal-periods.service';
import { generateId } from '@sse/shared-utils';
import { CreateJournalEntryDto, CreateJournalEntryLineDto } from './dto/create-journal-entry.dto';
import { QueryJournalEntryDto } from './dto/query-journal-entry.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class JournalEntriesService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly fiscalPeriodsService: FiscalPeriodsService,
  ) {}

  async findAll(tenantId: string, query: QueryJournalEntryDto): Promise<PaginatedResult<any>> {
    const knex = await this.tenantDb.getConnection();
    const {
      search, status, fiscal_period_id, date_from, date_to,
      page = 1, limit = 20, sort_by = 'entry_date', sort_order = 'desc',
    } = query;

    const baseQuery = knex('journal_entries').where({ tenant_id: tenantId });

    if (search) {
      baseQuery.where(function () {
        this.whereILike('entry_number', `%${search}%`)
          .orWhereILike('description', `%${search}%`);
      });
    }

    if (status) baseQuery.where('status', status);
    if (fiscal_period_id) baseQuery.where('fiscal_period_id', fiscal_period_id);
    if (date_from) baseQuery.where('entry_date', '>=', date_from);
    if (date_to) baseQuery.where('entry_date', '<=', date_to);

    const [{ count }] = await baseQuery.clone().count('id as count');
    const total = Number(count);

    const allowedSorts = ['entry_number', 'entry_date', 'status', 'total_debit', 'created_at'];
    const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'entry_date';

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .orderBy(sortColumn, sort_order)
      .limit(limit)
      .offset(offset);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const entry = await knex('journal_entries')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!entry) throw new NotFoundException('Journal entry not found');

    const lines = await knex('journal_entry_lines')
      .where({ journal_entry_id: id, tenant_id: tenantId })
      .leftJoin('chart_of_accounts', 'journal_entry_lines.account_id', 'chart_of_accounts.id')
      .select(
        'journal_entry_lines.*',
        'chart_of_accounts.account_number',
        'chart_of_accounts.name as account_name',
      )
      .orderBy('sort_order', 'asc');

    return { ...entry, lines };
  }

  async create(tenantId: string, userId: string, dto: CreateJournalEntryDto) {
    const knex = await this.tenantDb.getConnection();

    // Validate minimum 2 lines
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least 2 lines');
    }

    // Validate each line has debit XOR credit
    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('Each line must have either debit or credit, not both');
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException('Each line must have a non-zero debit or credit');
      }
    }

    // Validate debits = credits
    const totalDebit = dto.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `Entry does not balance: total debit (${totalDebit.toFixed(2)}) ≠ total credit (${totalCredit.toFixed(2)})`,
      );
    }

    // Find open fiscal period for the entry date
    const period = await this.fiscalPeriodsService.findOpenPeriodForDate(tenantId, dto.entry_date);
    if (!period) {
      throw new BadRequestException(`No open fiscal period covers the date ${dto.entry_date}`);
    }

    // Validate all account_ids exist and are active
    const accountIds = dto.lines.map((l) => l.account_id);
    const accounts = await knex('chart_of_accounts')
      .where({ tenant_id: tenantId, deleted_at: null, is_active: true })
      .whereIn('id', accountIds);
    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('One or more account IDs are invalid or inactive');
    }

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(knex, tenantId);

    return knex.transaction(async (trx) => {
      const [entry] = await trx('journal_entries')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          entry_number: entryNumber,
          fiscal_period_id: period.id,
          entry_date: dto.entry_date,
          description: dto.description,
          reference_type: dto.reference_type || null,
          reference_id: dto.reference_id || null,
          status: 'draft',
          total_debit: totalDebit,
          total_credit: totalCredit,
          created_by: userId,
        })
        .returning('*');

      const lineRecords = dto.lines.map((line: CreateJournalEntryLineDto, index: number) => ({
        id: generateId(),
        tenant_id: tenantId,
        journal_entry_id: entry.id,
        account_id: line.account_id,
        debit: line.debit,
        credit: line.credit,
        description: line.description || null,
        sort_order: index + 1,
      }));

      await trx('journal_entry_lines').insert(lineRecords);

      return { ...entry, lines: lineRecords };
    });
  }

  async post(tenantId: string, id: string, userId: string) {
    const knex = await this.tenantDb.getConnection();
    const entry = await knex('journal_entries')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!entry) throw new NotFoundException('Journal entry not found');

    if (entry.status !== 'draft') {
      throw new BadRequestException(`Cannot post an entry with status "${entry.status}"`);
    }

    // Verify fiscal period is still open
    const period = await knex('fiscal_periods')
      .where({ id: entry.fiscal_period_id, tenant_id: tenantId })
      .first();
    if (!period || period.status !== 'open') {
      throw new BadRequestException('Fiscal period is not open');
    }

    // Verify balance
    if (Math.abs(Number(entry.total_debit) - Number(entry.total_credit)) > 0.001) {
      throw new BadRequestException('Entry does not balance');
    }

    const [record] = await knex('journal_entries')
      .where({ id, tenant_id: tenantId })
      .update({ status: 'posted', posted_at: new Date(), posted_by: userId })
      .returning('*');
    return record;
  }

  async reverse(tenantId: string, id: string, userId: string, description?: string) {
    const knex = await this.tenantDb.getConnection();
    const entry = await knex('journal_entries')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!entry) throw new NotFoundException('Journal entry not found');

    if (entry.status !== 'posted') {
      throw new BadRequestException('Only posted entries can be reversed');
    }

    // Verify fiscal period is open
    const period = await this.fiscalPeriodsService.findOpenPeriodForDate(tenantId, new Date().toISOString().split('T')[0]);
    if (!period) {
      throw new BadRequestException('No open fiscal period for today\'s date');
    }

    const lines = await knex('journal_entry_lines')
      .where({ journal_entry_id: id, tenant_id: tenantId });

    const entryNumber = await this.generateEntryNumber(knex, tenantId);

    return knex.transaction(async (trx) => {
      // Mark original as reversed
      await trx('journal_entries')
        .where({ id, tenant_id: tenantId })
        .update({ status: 'reversed' });

      // Create reversing entry (swap debits and credits)
      const [reversalEntry] = await trx('journal_entries')
        .insert({
          id: generateId(),
          tenant_id: tenantId,
          entry_number: entryNumber,
          fiscal_period_id: period.id,
          entry_date: new Date().toISOString().split('T')[0],
          description: description || `Reversal of ${entry.entry_number}`,
          status: 'posted',
          reference_type: 'reversal',
          reference_id: id,
          total_debit: entry.total_credit,
          total_credit: entry.total_debit,
          created_by: userId,
          posted_at: new Date(),
          posted_by: userId,
          reversed_entry_id: id,
        })
        .returning('*');

      // Reverse lines: swap debit/credit
      const reversalLines = lines.map((line: any, index: number) => ({
        id: generateId(),
        tenant_id: tenantId,
        journal_entry_id: reversalEntry.id,
        account_id: line.account_id,
        debit: line.credit,
        credit: line.debit,
        description: line.description ? `Reversal: ${line.description}` : null,
        sort_order: index + 1,
      }));

      await trx('journal_entry_lines').insert(reversalLines);

      return reversalEntry;
    });
  }

  async remove(tenantId: string, id: string) {
    const knex = await this.tenantDb.getConnection();
    const entry = await knex('journal_entries')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!entry) throw new NotFoundException('Journal entry not found');

    if (entry.status !== 'draft') {
      throw new BadRequestException('Only draft entries can be deleted');
    }

    return knex.transaction(async (trx) => {
      await trx('journal_entry_lines')
        .where({ journal_entry_id: id, tenant_id: tenantId })
        .del();
      await trx('journal_entries')
        .where({ id, tenant_id: tenantId })
        .del();
      return { deleted: true };
    });
  }

  private async generateEntryNumber(knex: any, tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await knex('journal_entries')
      .where({ tenant_id: tenantId })
      .whereRaw("entry_number LIKE ?", [`JE-${year}-%`])
      .count('id as count');
    const seq = Number(result.count) + 1;
    return `JE-${year}-${String(seq).padStart(4, '0')}`;
  }
}
