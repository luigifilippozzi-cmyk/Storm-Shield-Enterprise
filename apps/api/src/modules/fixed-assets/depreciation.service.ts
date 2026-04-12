import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { JournalEntriesService } from '../accounting/journal-entries/journal-entries.service';
import { generateId } from '@sse/shared-utils';
import { DepreciationMethod } from '@sse/shared-types';

@Injectable()
export class DepreciationService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  /**
   * Calculate monthly depreciation amount for a given asset using its configured method.
   */
  calculateMonthlyDepreciation(
    acquisitionCost: number,
    salvageValue: number,
    usefulLifeMonths: number,
    accumulatedDepreciation: number,
    method: DepreciationMethod,
    elapsedMonths: number,
  ): number {
    const depreciableBase = acquisitionCost - salvageValue;
    const remaining = depreciableBase - accumulatedDepreciation;

    if (remaining <= 0 || elapsedMonths >= usefulLifeMonths) return 0;

    switch (method) {
      case DepreciationMethod.STRAIGHT_LINE: {
        const monthlyAmount = depreciableBase / usefulLifeMonths;
        return Math.min(Math.round(monthlyAmount * 100) / 100, remaining);
      }

      case DepreciationMethod.DECLINING_BALANCE: {
        const rate = (2 / usefulLifeMonths);
        const currentBookValue = acquisitionCost - accumulatedDepreciation;
        const amount = currentBookValue * rate;
        return Math.min(Math.round(amount * 100) / 100, remaining);
      }

      case DepreciationMethod.SUM_OF_YEARS: {
        const totalYears = Math.ceil(usefulLifeMonths / 12);
        const sumOfYears = (totalYears * (totalYears + 1)) / 2;
        const currentYear = Math.floor(elapsedMonths / 12) + 1;
        const remainingYears = totalYears - currentYear + 1;
        const annualAmount = (remainingYears / sumOfYears) * depreciableBase;
        const monthlyAmount = annualAmount / 12;
        return Math.min(Math.round(monthlyAmount * 100) / 100, remaining);
      }

      case DepreciationMethod.MACRS:
        // MACRS uses IRS tables — simplified to straight-line for NestJS layer.
        // Full MACRS with half-year convention should use stored procedure.
        return Math.min(
          Math.round((depreciableBase / usefulLifeMonths) * 100) / 100,
          remaining,
        );

      case DepreciationMethod.UNITS_OF_PRODUCTION:
        // Requires units parameter — handled separately
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Execute depreciation for a single asset, creating a journal entry and updating caches.
   */
  async executeDepreciation(
    tenantId: string,
    userId: string,
    fixedAssetId: string,
    fiscalPeriodId: string,
    entryDate: string,
    notes?: string,
  ) {
    const knex = await this.tenantDb.getConnection();

    // Load asset
    const asset = await knex('fixed_assets')
      .where({ id: fixedAssetId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!asset) throw new NotFoundException('Fixed asset not found');

    if (asset.status !== 'active') {
      throw new BadRequestException(`Cannot depreciate asset with status "${asset.status}"`);
    }

    // Check for duplicate depreciation in this period
    const existingEntry = await knex('depreciation_entries')
      .where({
        tenant_id: tenantId,
        fixed_asset_id: fixedAssetId,
        fiscal_period_id: fiscalPeriodId,
        entry_type: 'regular',
      })
      .first();
    if (existingEntry) {
      throw new BadRequestException('Depreciation already executed for this asset in this period');
    }

    // Load category for GL accounts
    const category = await knex('asset_categories')
      .where({ id: asset.category_id, tenant_id: tenantId })
      .first();
    if (!category) throw new BadRequestException('Asset category not found');

    // Calculate depreciation
    const accDep = Number(asset.accumulated_depreciation);
    const acquisitionCost = Number(asset.acquisition_cost);
    const salvageValue = Number(asset.salvage_value);

    // Calculate elapsed months from depreciation_start_date
    const startDate = new Date(asset.depreciation_start_date);
    const currentDate = new Date(entryDate);
    const elapsedMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12
      + (currentDate.getMonth() - startDate.getMonth());

    const depAmount = this.calculateMonthlyDepreciation(
      acquisitionCost, salvageValue, asset.useful_life_months,
      accDep, asset.depreciation_method, elapsedMonths,
    );

    if (depAmount <= 0) {
      throw new BadRequestException('Asset is fully depreciated — no depreciation to record');
    }

    // Create journal entry: D:expense_account / C:depreciation_account
    const journalEntry = await this.journalEntriesService.create(tenantId, userId, {
      entry_date: entryDate,
      description: `Depreciation — ${asset.asset_name} (${asset.asset_tag})`,
      reference_type: 'depreciation',
      reference_id: fixedAssetId,
      lines: [
        {
          account_id: category.expense_account_id,
          debit: depAmount,
          credit: 0,
          description: `Depreciation expense — ${asset.asset_tag}`,
        },
        {
          account_id: category.depreciation_account_id,
          debit: 0,
          credit: depAmount,
          description: `Accumulated depreciation — ${asset.asset_tag}`,
        },
      ],
    });

    // Post the journal entry
    await this.journalEntriesService.post(tenantId, journalEntry.id, userId);

    // Update asset caches
    const newAccDep = accDep + depAmount;
    const newNBV = acquisitionCost - newAccDep;
    const newStatus = newNBV <= salvageValue ? 'fully_depreciated' : 'active';

    await knex('fixed_assets')
      .where({ id: fixedAssetId, tenant_id: tenantId })
      .update({
        accumulated_depreciation: newAccDep,
        net_book_value: newNBV,
        last_depreciation_date: entryDate,
        status: newStatus,
        updated_at: new Date(),
      });

    // Create depreciation entry record
    const [depEntry] = await knex('depreciation_entries')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        fixed_asset_id: fixedAssetId,
        fiscal_period_id: fiscalPeriodId,
        entry_date: entryDate,
        depreciation_amount: depAmount,
        accumulated_depreciation: newAccDep,
        net_book_value: newNBV,
        journal_entry_id: journalEntry.id,
        entry_type: 'regular',
        notes: notes || null,
        created_by: userId,
      })
      .returning('*');

    return depEntry;
  }

  /**
   * Execute depreciation for all active assets in a tenant for a given period.
   */
  async executeBatchDepreciation(
    tenantId: string,
    userId: string,
    fiscalPeriodId: string,
    entryDate: string,
  ) {
    const knex = await this.tenantDb.getConnection();

    const activeAssets = await knex('fixed_assets')
      .where({ tenant_id: tenantId, status: 'active', deleted_at: null });

    const results: Array<{ asset_id: string; asset_tag: string; amount: number; error?: string }> = [];

    for (const asset of activeAssets) {
      try {
        const entry = await this.executeDepreciation(
          tenantId, userId, asset.id, fiscalPeriodId, entryDate,
        );
        results.push({
          asset_id: asset.id,
          asset_tag: asset.asset_tag,
          amount: Number(entry.depreciation_amount),
        });
      } catch (err: any) {
        results.push({
          asset_id: asset.id,
          asset_tag: asset.asset_tag,
          amount: 0,
          error: err.message,
        });
      }
    }

    return {
      total_assets: activeAssets.length,
      processed: results.filter((r) => !r.error).length,
      skipped: results.filter((r) => !!r.error).length,
      total_depreciation: results.reduce((sum, r) => sum + r.amount, 0),
      details: results,
    };
  }
}
