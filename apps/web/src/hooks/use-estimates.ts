'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Estimate } from '@sse/shared-types';

export interface EstimateFilters {
  search?: string;
  status?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedEstimates {
  data: Estimate[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface EstimateLineInput {
  line_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  is_taxable?: boolean;
  sort_order?: number;
}

export interface CreateEstimateInput {
  customer_id: string;
  vehicle_id: string;
  insurance_company_id?: string;
  claim_number?: string;
  deductible?: number;
  notes?: string;
  valid_until?: string;
  lines?: EstimateLineInput[];
}

export type UpdateEstimateInput = Partial<CreateEstimateInput>;

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => ({ token: (await getToken()) || undefined });
}

export function useEstimates(filters: EstimateFilters = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();

  return useQuery({
    queryKey: ['estimates', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedEstimates>(`/estimates${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useEstimate(id: string) {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['estimates', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<Estimate>(`/estimates/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: CreateEstimateInput) => {
      const { token } = await getHeaders();
      return api<Estimate>('/estimates', { method: 'POST', body: JSON.stringify(data), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useUpdateEstimate(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: UpdateEstimateInput) => {
      const { token } = await getHeaders();
      return api<Estimate>(`/estimates/${id}`, { method: 'PUT', body: JSON.stringify(data), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useUpdateEstimateStatus(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (status: string) => {
      const { token } = await getHeaders();
      return api<Estimate>(`/estimates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useDeleteEstimate() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/estimates/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}
