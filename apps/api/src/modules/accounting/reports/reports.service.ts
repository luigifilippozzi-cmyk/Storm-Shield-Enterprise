import { Injectable } from '@nestjs/common';
import { TenantDatabaseService } from '../../../config/tenant-database.service';
import type { Knex } from 'knex';

export interface TrialBalanceRow {
  account_number: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  total_debits: number;
  total_credits: number;
  balance: number;
}

export interface TrialBalanceReport {
  as_of_date: string;
  fiscal_period_id?: string;
  total_debits: number;
  total_credits: number;
  rows: TrialBalanceRow[];
}

export interface ProfitLossSection {
  name: string;
  rows: { account_number: string; account_name: string; amount: number }[];
  total: number;
}

export interface ProfitLossReport {
  date_from: string;
  date_to: string;
  revenue: ProfitLossSection;
  expenses: ProfitLossSection;
  net_income: number;
}

export interface BalanceSheetSection {
  name: string;
  rows: { account_number: string; account_name: string; balance: number }[];
  total: number;
}

export interface BalanceSheetReport {
  as_of_date: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  total_liabilities_and_equity: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  private async getPostedLineBalances(
    knex: Knex,
    tenantId: string,
    opts: { as_of_date?: string; date_from?: string; date_to?: string; fiscal_period_id?: string },
  ) {
    const q = knex('journal_entry_lines as jel')
      .join('journal_entries as je', 'jel.journal_entry_id', 'je.id')
      .join('chart_of_accounts as coa', 'jel.account_id', 'coa.id')
      .where('je.tenant_id', tenantId)
      .where('jel.tenant_id', tenantId)
      .where('je.status', 'posted')
      .where('coa.deleted_at', null)
      .select(
        'coa.id as account_id',
        'coa.account_number',
        'coa.name as account_name',
        'coa.account_type',
        'coa.normal_balance',
        knex.raw('SUM(jel.debit) as total_debits'),
        knex.raw('SUM(jel.credit) as total_credits'),
      )
      .groupBy('coa.id', 'coa.account_number', 'coa.name', 'coa.account_type', 'coa.normal_balance')
      .orderBy('coa.account_number', 'asc');

    if (opts.as_of_date) {
      q.where('je.entry_date', '<=', opts.as_of_date);
    }
    if (opts.date_from) {
      q.where('je.entry_date', '>=', opts.date_from);
    }
    if (opts.date_to) {
      q.where('je.entry_date', '<=', opts.date_to);
    }
    if (opts.fiscal_period_id) {
      q.where('je.fiscal_period_id', opts.fiscal_period_id);
    }

    return q;
  }

  async getTrialBalance(tenantId: string, opts: {
    as_of_date?: string;
    fiscal_period_id?: string;
  }): Promise<TrialBalanceReport> {
    const knex = await this.tenantDb.getConnection();
    const asOfDate = opts.as_of_date || new Date().toISOString().slice(0, 10);

    const rows = await this.getPostedLineBalances(knex, tenantId, {
      as_of_date: asOfDate,
      fiscal_period_id: opts.fiscal_period_id,
    });

    const mapped: TrialBalanceRow[] = rows.map((r: any) => {
      const debits = Number(r.total_debits) || 0;
      const credits = Number(r.total_credits) || 0;
      // Balance = normal_balance side minus opposite
      const balance = r.normal_balance === 'debit' ? debits - credits : credits - debits;
      return {
        account_number: r.account_number,
        account_name: r.account_name,
        account_type: r.account_type,
        normal_balance: r.normal_balance,
        total_debits: debits,
        total_credits: credits,
        balance,
      };
    });

    const totalDebits = mapped.reduce((s, r) => s + r.total_debits, 0);
    const totalCredits = mapped.reduce((s, r) => s + r.total_credits, 0);

    return {
      as_of_date: asOfDate,
      fiscal_period_id: opts.fiscal_period_id,
      total_debits: Math.round(totalDebits * 100) / 100,
      total_credits: Math.round(totalCredits * 100) / 100,
      rows: mapped,
    };
  }

  async getProfitLoss(tenantId: string, opts: {
    date_from?: string;
    date_to?: string;
    fiscal_period_id?: string;
  }): Promise<ProfitLossReport> {
    const knex = await this.tenantDb.getConnection();
    const today = new Date().toISOString().slice(0, 10);

    // Default to current calendar year
    const dateFrom = opts.date_from || `${new Date().getFullYear()}-01-01`;
    const dateTo = opts.date_to || today;

    const rows = await this.getPostedLineBalances(knex, tenantId, {
      date_from: opts.fiscal_period_id ? undefined : dateFrom,
      date_to: opts.fiscal_period_id ? undefined : dateTo,
      fiscal_period_id: opts.fiscal_period_id,
    });

    const revenueRows: { account_number: string; account_name: string; amount: number }[] = [];
    const expenseRows: { account_number: string; account_name: string; amount: number }[] = [];

    for (const r of rows as any[]) {
      const debits = Number(r.total_debits) || 0;
      const credits = Number(r.total_credits) || 0;
      const acctNum = parseInt(r.account_number, 10);

      if (acctNum >= 4000 && acctNum <= 4999) {
        // Revenue: normal_balance = credit → amount = credits - debits
        revenueRows.push({
          account_number: r.account_number,
          account_name: r.account_name,
          amount: Math.round((credits - debits) * 100) / 100,
        });
      } else if (acctNum >= 5000 && acctNum <= 9999) {
        // Expenses: normal_balance = debit → amount = debits - credits
        expenseRows.push({
          account_number: r.account_number,
          account_name: r.account_name,
          amount: Math.round((debits - credits) * 100) / 100,
        });
      }
    }

    const totalRevenue = revenueRows.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0);

    return {
      date_from: dateFrom,
      date_to: dateTo,
      revenue: { name: 'Revenue', rows: revenueRows, total: Math.round(totalRevenue * 100) / 100 },
      expenses: { name: 'Expenses', rows: expenseRows, total: Math.round(totalExpenses * 100) / 100 },
      net_income: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    };
  }

  async getBalanceSheet(tenantId: string, opts: { as_of_date?: string }): Promise<BalanceSheetReport> {
    const knex = await this.tenantDb.getConnection();
    const asOfDate = opts.as_of_date || new Date().toISOString().slice(0, 10);

    const rows = await this.getPostedLineBalances(knex, tenantId, { as_of_date: asOfDate });

    const assetRows: { account_number: string; account_name: string; balance: number }[] = [];
    const liabilityRows: { account_number: string; account_name: string; balance: number }[] = [];
    const equityRows: { account_number: string; account_name: string; balance: number }[] = [];

    for (const r of rows as any[]) {
      const debits = Number(r.total_debits) || 0;
      const credits = Number(r.total_credits) || 0;
      const acctNum = parseInt(r.account_number, 10);
      // Balance = normal balance side minus opposite
      const balance = r.normal_balance === 'debit'
        ? Math.round((debits - credits) * 100) / 100
        : Math.round((credits - debits) * 100) / 100;

      if (acctNum >= 1000 && acctNum <= 1999) {
        assetRows.push({ account_number: r.account_number, account_name: r.account_name, balance });
      } else if (acctNum >= 2000 && acctNum <= 2999) {
        liabilityRows.push({ account_number: r.account_number, account_name: r.account_name, balance });
      } else if (acctNum >= 3000 && acctNum <= 3999) {
        equityRows.push({ account_number: r.account_number, account_name: r.account_name, balance });
      }
    }

    const totalAssets = assetRows.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilityRows.reduce((s, r) => s + r.balance, 0);
    const totalEquity = equityRows.reduce((s, r) => s + r.balance, 0);

    return {
      as_of_date: asOfDate,
      assets: {
        name: 'Assets',
        rows: assetRows,
        total: Math.round(totalAssets * 100) / 100,
      },
      liabilities: {
        name: 'Liabilities',
        rows: liabilityRows,
        total: Math.round(totalLiabilities * 100) / 100,
      },
      equity: {
        name: 'Equity',
        rows: equityRows,
        total: Math.round(totalEquity * 100) / 100,
      },
      total_liabilities_and_equity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
    };
  }
}
