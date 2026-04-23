'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface Account {
  id: string;
  account_number: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  description?: string;
  parent_account_id?: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFilters {
  search?: string;
  account_type?: AccountType;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedAccounts {
  data: Account[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    return { token };
  };
}

export function useAccounts(filters: AccountFilters = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.account_type) params.set('account_type', filters.account_type);
  if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit ?? 50));

  return useQuery<PaginatedAccounts>({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedAccounts>(`/accounting/accounts?${params}`, { token });
    },
  });
}
