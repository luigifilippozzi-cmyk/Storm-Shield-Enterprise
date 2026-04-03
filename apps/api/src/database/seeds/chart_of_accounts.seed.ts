import { Knex } from 'knex';
import { v7 as uuidv7 } from 'uuid';

interface AccountSeed {
  account_number: string;
  name: string;
  account_type: string;
  normal_balance: string;
  parent_number?: string;
}

const ACCOUNTS: AccountSeed[] = [
  // Assets (1000-1999)
  { account_number: '1000', name: 'Assets', account_type: 'asset', normal_balance: 'debit' },
  { account_number: '1010', name: 'Cash / Checking', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1020', name: 'Savings Account', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1050', name: 'Petty Cash', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1100', name: 'Accounts Receivable', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1200', name: 'Inventory - Parts', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1300', name: 'Prepaid Expenses', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1500', name: 'Fixed Assets', account_type: 'asset', normal_balance: 'debit', parent_number: '1000' },
  { account_number: '1510', name: 'Equipment', account_type: 'asset', normal_balance: 'debit', parent_number: '1500' },
  { account_number: '1520', name: 'Vehicles', account_type: 'asset', normal_balance: 'debit', parent_number: '1500' },
  { account_number: '1530', name: 'Furniture & Fixtures', account_type: 'asset', normal_balance: 'debit', parent_number: '1500' },
  { account_number: '1540', name: 'Computer Equipment', account_type: 'asset', normal_balance: 'debit', parent_number: '1500' },
  { account_number: '1550', name: 'Leasehold Improvements', account_type: 'asset', normal_balance: 'debit', parent_number: '1500' },
  { account_number: '1590', name: 'Accumulated Depreciation', account_type: 'asset', normal_balance: 'credit', parent_number: '1500' },

  // Liabilities (2000-2999)
  { account_number: '2000', name: 'Liabilities', account_type: 'liability', normal_balance: 'credit' },
  { account_number: '2010', name: 'Accounts Payable', account_type: 'liability', normal_balance: 'credit', parent_number: '2000' },
  { account_number: '2100', name: 'Credit Card Payable', account_type: 'liability', normal_balance: 'credit', parent_number: '2000' },
  { account_number: '2200', name: 'Accrued Expenses', account_type: 'liability', normal_balance: 'credit', parent_number: '2000' },
  { account_number: '2300', name: 'Sales Tax Payable', account_type: 'liability', normal_balance: 'credit', parent_number: '2000' },
  { account_number: '2400', name: 'Payroll Liabilities', account_type: 'liability', normal_balance: 'credit', parent_number: '2000' },

  // Equity (3000-3999)
  { account_number: '3000', name: 'Equity', account_type: 'equity', normal_balance: 'credit' },
  { account_number: '3010', name: "Owner's Equity", account_type: 'equity', normal_balance: 'credit', parent_number: '3000' },
  { account_number: '3100', name: 'Retained Earnings', account_type: 'equity', normal_balance: 'credit', parent_number: '3000' },
  { account_number: '3200', name: 'Current Year Earnings', account_type: 'equity', normal_balance: 'credit', parent_number: '3000' },

  // Revenue (4000-4999)
  { account_number: '4000', name: 'Revenue', account_type: 'revenue', normal_balance: 'credit' },
  { account_number: '4010', name: 'PDR Revenue', account_type: 'revenue', normal_balance: 'credit', parent_number: '4000' },
  { account_number: '4020', name: 'Paint & Body Revenue', account_type: 'revenue', normal_balance: 'credit', parent_number: '4000' },
  { account_number: '4030', name: 'Insurance Revenue', account_type: 'revenue', normal_balance: 'credit', parent_number: '4000' },
  { account_number: '4040', name: 'Rental Revenue', account_type: 'revenue', normal_balance: 'credit', parent_number: '4000' },
  { account_number: '4090', name: 'Other Revenue', account_type: 'revenue', normal_balance: 'credit', parent_number: '4000' },

  // Expenses (5000-9999)
  { account_number: '5000', name: 'Cost of Goods Sold', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5010', name: 'Parts Expense', account_type: 'expense', normal_balance: 'debit', parent_number: '5000' },
  { account_number: '5020', name: 'Sublet Expense', account_type: 'expense', normal_balance: 'debit', parent_number: '5000' },
  { account_number: '5100', name: 'Payroll Expense', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5200', name: 'Contractor Expense', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5300', name: 'Rent Expense', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5400', name: 'Utilities Expense', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5500', name: 'Insurance Expense', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5600', name: 'Office Supplies', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5700', name: 'Marketing & Advertising', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5800', name: 'Depreciation Expense', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '5900', name: 'Repairs & Maintenance', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '9000', name: 'Other Expenses', account_type: 'expense', normal_balance: 'debit' },
  { account_number: '9100', name: 'Gain/Loss on Asset Disposal', account_type: 'expense', normal_balance: 'debit' },
];

export async function seedChartOfAccounts(knex: Knex, tenantId: string) {
  const accountMap = new Map<string, string>();

  for (const account of ACCOUNTS) {
    const id = uuidv7();
    accountMap.set(account.account_number, id);

    await knex('chart_of_accounts').insert({
      id,
      tenant_id: tenantId,
      account_number: account.account_number,
      name: account.name,
      account_type: account.account_type,
      normal_balance: account.normal_balance,
      parent_id: account.parent_number ? accountMap.get(account.parent_number) || null : null,
      is_active: true,
      is_system: true,
    });
  }

  return accountMap;
}
