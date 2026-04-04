'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Customer } from '@sse/shared-types';

// ── Types ──

export interface CustomerFilters {
  search?: string;
  type?: string;
  source?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCustomerInput {
  type?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  phone_secondary?: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source?: string;
  insurance_company_id?: string;
  policy_number?: string;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

// ── Helper to build auth headers ──

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    return { token };
  };
}

// ── Hooks ──

export function useCustomers(filters: CustomerFilters = {}) {
  const getHeaders = useApiHeaders();

  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.source) params.set('source', filters.source);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const endpoint = `/customers${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedCustomers>(endpoint, { token });
    },
  });
}

export function useCustomer(id: string) {
  const getHeaders = useApiHeaders();

  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<Customer>(`/customers/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const { token } = await getHeaders();
      return api<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: UpdateCustomerInput) => {
      const { token } = await getHeaders();
      return api<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/customers/${id}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
