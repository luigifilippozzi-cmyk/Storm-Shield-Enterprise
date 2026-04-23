'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

export interface JournalEntryLine {
  id: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  description?: string;
  debit_amount: string;
  credit_amount: string;
  line_order: number;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description?: string;
  status: JournalEntryStatus;
  total_debit: string;
  total_credit: string;
  fiscal_period_id?: string;
  reference?: string;
  reversed_by_id?: string;
  created_at: string;
  updated_at: string;
  lines?: JournalEntryLine[];
}

export interface JournalEntryFilters {
  search?: string;
  status?: JournalEntryStatus;
  date_from?: string;
  date_to?: string;
  fiscal_period_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedJournalEntries {
  data: JournalEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    return { token };
  };
}

export function useJournalEntries(filters: JournalEntryFilters = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.fiscal_period_id) params.set('fiscal_period_id', filters.fiscal_period_id);
  if (filters.page) params.set('page', String(filters.page));
  params.set('limit', String(filters.limit ?? 20));

  return useQuery<PaginatedJournalEntries>({
    queryKey: ['journal-entries', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedJournalEntries>(`/accounting/journal-entries?${params}`, { token });
    },
  });
}

export function useJournalEntry(id: string) {
  const getHeaders = useApiHeaders();
  return useQuery<JournalEntry>({
    queryKey: ['journal-entry', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<JournalEntry>(`/accounting/journal-entries/${id}`, { token });
    },
    enabled: !!id,
  });
}
