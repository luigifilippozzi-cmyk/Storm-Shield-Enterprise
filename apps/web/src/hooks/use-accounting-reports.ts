'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

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

export interface ReportRow {
  account_number: string;
  account_name: string;
  amount: number;
}

export interface ReportSection {
  name: string;
  rows: ReportRow[];
  total: number;
}

export interface ProfitLossReport {
  date_from: string;
  date_to: string;
  revenue: ReportSection;
  expenses: ReportSection;
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

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => ({ token: (await getToken()) || undefined });
}

export function useTrialBalance(opts: { as_of_date?: string; fiscal_period_id?: string } = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  if (opts.as_of_date) params.set('as_of_date', opts.as_of_date);
  if (opts.fiscal_period_id) params.set('fiscal_period_id', opts.fiscal_period_id);
  const qs = params.toString();

  return useQuery({
    queryKey: ['accounting', 'reports', 'trial-balance', opts],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<TrialBalanceReport>(`/accounting/reports/trial-balance${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useProfitLoss(opts: { date_from?: string; date_to?: string; fiscal_period_id?: string } = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  if (opts.date_from) params.set('date_from', opts.date_from);
  if (opts.date_to) params.set('date_to', opts.date_to);
  if (opts.fiscal_period_id) params.set('fiscal_period_id', opts.fiscal_period_id);
  const qs = params.toString();

  return useQuery({
    queryKey: ['accounting', 'reports', 'profit-loss', opts],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<ProfitLossReport>(`/accounting/reports/profit-loss${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useBalanceSheet(opts: { as_of_date?: string } = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  if (opts.as_of_date) params.set('as_of_date', opts.as_of_date);
  const qs = params.toString();

  return useQuery({
    queryKey: ['accounting', 'reports', 'balance-sheet', opts],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<BalanceSheetReport>(`/accounting/reports/balance-sheet${qs ? `?${qs}` : ''}`, { token });
    },
  });
}
