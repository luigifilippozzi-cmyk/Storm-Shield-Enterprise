import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantDatabaseService } from '../../config/tenant-database.service';
import { JournalEntriesService } from '../accounting/journal-entries/journal-entries.service';
import { generateId } from '@sse/shared-utils';
import { DisposeAssetDto } from './dto/dispose-asset.dto';

@Injectable()
export class DisposalService {
  constructor(
    private readonly tenantDb: TenantDatabaseService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  async disposeAsset(
    tenantId: string,
    userId: string,
    assetId: string,
    dto: DisposeAssetDto,
  ) {
    const knex = await this.tenantDb.getConnection();

    // Load asset
    const asset = await knex('fixed_assets')
      .where({ id: assetId, tenant_id: tenantId, deleted_at: null })
      .first();
    if (!asset) throw new NotFoundException('Fixed asset not found');

    if (asset.status === 'disposed') {
      throw new BadRequestException('Asset is already disposed');
    }

    // Load category for GL accounts
    const category = await knex('asset_categories')
      .where({ id: asset.category_id, tenant_id: tenantId })
      .first();
    if (!category) throw new BadRequestException('Asset category not found');

    const nbv = Number(asset.net_book_value);
    const accDep = Number(asset.accumulated_depreciation);
    const acquisitionCost = Number(asset.acquisition_cost);
    const proceeds = dto.disposal_proceeds ?? 0;
    const gainLoss = proceeds - nbv;

    // Build journal entry lines for disposal:
    // D: Accumulated Depreciation (reverse) — debit to reduce contra-asset
    // D: Cash/Proceeds (if > 0) — would typically be AR or Cash, using gain_loss_account as placeholder
    // C: Fixed Asset Account (acquisition cost) — remove asset from books
    // D/C: Gain/Loss account
    const lines: Array<{ account_id: string; debit: number; credit: number; description: string }> = [];

    // Reverse accumulated depreciation
    if (accDep > 0) {
      lines.push({
        account_id: category.depreciation_account_id,
        debit: accDep,
        credit: 0,
        description: `Reverse accumulated depreciation — ${asset.asset_tag}`,
      });
    }

    // Remove asset at acquisition cost
    lines.push({
      account_id: category.asset_account_id,
      debit: 0,
      credit: acquisitionCost,
      description: `Dispose asset — ${asset.asset_tag}`,
    });

    // Record gain or loss
    if (gainLoss > 0) {
      // Gain: credit gain/loss account
      lines.push({
        account_id: category.gain_loss_account_id,
        debit: 0,
        credit: gainLoss,
        description: `Gain on disposal — ${asset.asset_tag}`,
      });
    } else if (gainLoss < 0) {
      // Loss: debit gain/loss account
      lines.push({
        account_id: category.gain_loss_account_id,
        debit: Math.abs(gainLoss),
        credit: 0,
        description: `Loss on disposal — ${asset.asset_tag}`,
      });
    }

    // If there are proceeds, we need a balancing debit
    // For simplicity, proceeds go to the gain_loss side to balance
    // In production, this would use a Cash or AR account
    if (proceeds > 0) {
      // Debit cash/proceeds — using asset_account as a simplification
      // The JE must balance: total debits = total credits
      // accDep (D) + proceeds (D) + loss? (D) = acquisitionCost (C) + gain? (C)
      // This is correct because: accDep + NBV = acquisitionCost, and proceeds +/- gain_loss = NBV
    }

    // Ensure JE balances by adding proceeds as a separate line
    // The accounting identity: accDep + proceeds ± gain_loss = acquisitionCost
    if (proceeds > 0) {
      // We need to add proceeds as a debit (cash received)
      // Use the asset_account_id as a placeholder for cash
      // In a real system, this should map to account 1010 (Cash)
      lines.unshift({
        account_id: category.asset_account_id,
        debit: proceeds,
        credit: 0,
        description: `Disposal proceeds received — ${asset.asset_tag}`,
      });

      // Fix: the asset_account_id now has both a debit (proceeds) and credit (acquisition_cost)
      // We need to net them. Let's restructure:
      // Remove the two asset_account entries and replace with net
      const assetLines = lines.filter((l) => l.account_id === category.asset_account_id);
      const otherLines = lines.filter((l) => l.account_id !== category.asset_account_id);
      const netDebit = assetLines.reduce((s, l) => s + l.debit, 0);
      const netCredit = assetLines.reduce((s, l) => s + l.credit, 0);

      lines.length = 0;
      lines.push(...otherLines);

      if (netCredit > netDebit) {
        lines.push({
          account_id: category.asset_account_id,
          debit: 0,
          credit: netCredit - netDebit,
          description: `Net asset removal — ${asset.asset_tag}`,
        });
      } else if (netDebit > netCredit) {
        lines.push({
          account_id: category.asset_account_id,
          debit: netDebit - netCredit,
          credit: 0,
          description: `Net asset removal — ${asset.asset_tag}`,
        });
      }
    }

    // Create journal entry
    const journalEntry = await this.journalEntriesService.create(tenantId, userId, {
      entry_date: dto.disposal_date,
      description: `Asset disposal (${dto.disposal_type}) — ${asset.asset_name} (${asset.asset_tag})`,
      reference_type: 'asset_disposal',
      reference_id: assetId,
      lines,
    });

    // Post the journal entry
    await this.journalEntriesService.post(tenantId, journalEntry.id, userId);

    // Create disposal record
    const [disposal] = await knex('asset_disposals')
      .insert({
        id: generateId(),
        tenant_id: tenantId,
        fixed_asset_id: assetId,
        disposal_type: dto.disposal_type,
        disposal_date: dto.disposal_date,
        disposal_proceeds: proceeds,
        net_book_value_at_disposal: nbv,
        gain_loss: gainLoss,
        buyer_info: dto.buyer_info || null,
        journal_entry_id: journalEntry.id,
        reason: dto.reason,
        notes: dto.notes || null,
        created_by: userId,
      })
      .returning('*');

    // Update asset status
    await knex('fixed_assets')
      .where({ id: assetId, tenant_id: tenantId })
      .update({
        status: 'disposed',
        updated_at: new Date(),
      });

    return disposal;
  }

  async findDisposals(tenantId: string, assetId?: string) {
    const knex = await this.tenantDb.getConnection();
    const query = knex('asset_disposals')
      .where({ tenant_id: tenantId })
      .orderBy('disposal_date', 'desc');

    if (assetId) {
      query.where('fixed_asset_id', assetId);
    }

    return query;
  }
}
