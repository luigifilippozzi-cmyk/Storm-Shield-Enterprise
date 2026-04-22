'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { FinancialTransaction } from '@sse/shared-types';

export interface TransactionFilters {
  search?: string;
  transaction_type?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedTransactions {
  data: FinancialTransaction[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  transaction_count: number;
}

export interface CreateTransactionInput {
  transaction_type: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  transaction_date: string;
  reference_number?: string;
  service_order_id?: string;
  customer_id?: string;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => ({ token: (await getToken()) || undefined });
}

export interface FinancialDashboard {
  summary: FinancialSummary;
  income_by_category: { category: string; total: string }[];
  expense_by_category: { category: string; total: string }[];
  monthly_trend: { month: string; income: string; expenses: string }[];
  recent_transactions: FinancialTransaction[];
}

export function useFinancialDashboard() {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['financial', 'dashboard'],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<FinancialDashboard>('/financial/dashboard', { token });
    },
  });
}

export function useFinancialSummary() {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['financial', 'summary'],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<FinancialSummary>('/financial/summary', { token });
    },
  });
}

export function useTransactions(filters: TransactionFilters = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();

  return useQuery({
    queryKey: ['financial', 'transactions', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedTransactions>(`/financial${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useTransaction(id: string) {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['financial', 'transactions', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<FinancialTransaction>(`/financial/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const { token } = await getHeaders();
      return api<FinancialTransaction>('/financial', { method: 'POST', body: JSON.stringify(data), token });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/financial/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}
