'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { InsuranceCompany } from '@sse/shared-types';

// ── Types ──

export interface InsuranceCompanyFilters {
  search?: string;
  is_drp?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedInsuranceCompanies {
  data: InsuranceCompany[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateInsuranceCompanyInput {
  name: string;
  code?: string;
  is_drp?: boolean;
  payment_terms_days?: number;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type UpdateInsuranceCompanyInput = Partial<CreateInsuranceCompanyInput>;

// ── Helper to build auth headers ──

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    return { token };
  };
}

// ── Hooks ──

export function useInsuranceCompanies(filters: InsuranceCompanyFilters = {}) {
  const getHeaders = useApiHeaders();

  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.is_drp !== undefined) params.set('is_drp', String(filters.is_drp));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const endpoint = `/insurance${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: ['insurance', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedInsuranceCompanies>(endpoint, { token });
    },
  });
}

export function useInsuranceCompany(id: string) {
  const getHeaders = useApiHeaders();

  return useQuery({
    queryKey: ['insurance', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<InsuranceCompany>(`/insurance/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateInsuranceCompany() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: CreateInsuranceCompanyInput) => {
      const { token } = await getHeaders();
      return api<InsuranceCompany>('/insurance', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function useUpdateInsuranceCompany(id: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: UpdateInsuranceCompanyInput) => {
      const { token } = await getHeaders();
      return api<InsuranceCompany>(`/insurance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function useDeleteInsuranceCompany() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/insurance/${id}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}
