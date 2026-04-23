'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

// ── Types ──

export type CaseStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high';
export type CaseType = 'complaint' | 'quality_issue' | 'refund_request' | 'general_inquiry' | 'other';

export interface Case {
  id: string;
  case_type: CaseType;
  opened_by_user_id: string;
  customer_id?: string;
  vehicle_id?: string;
  related_estimate_id?: string;
  related_so_id?: string;
  title: string;
  body: string;
  status: CaseStatus;
  priority: CasePriority;
  assigned_to_user_id?: string;
  opened_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseFilters {
  status?: CaseStatus;
  priority?: CasePriority;
  case_type?: CaseType;
  customer_id?: string;
  assigned_to_user_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCases {
  data: Case[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateCaseInput {
  case_type: CaseType;
  title: string;
  body: string;
  priority?: CasePriority;
  customer_id?: string;
  vehicle_id?: string;
  related_estimate_id?: string;
  related_so_id?: string;
  assigned_to_user_id?: string;
}

export interface UpdateCaseInput {
  title?: string;
  body?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  assigned_to_user_id?: string;
}

// ── Helper ──

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    return { token };
  };
}

// ── Hooks ──

export function useCases(filters: CaseFilters = {}) {
  const getHeaders = useApiHeaders();

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.case_type) params.set('case_type', filters.case_type);
  if (filters.customer_id) params.set('customer_id', filters.customer_id);
  if (filters.assigned_to_user_id) params.set('assigned_to_user_id', filters.assigned_to_user_id);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();

  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedCases>(`/cases${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useCase(id: string) {
  const getHeaders = useApiHeaders();

  return useQuery({
    queryKey: ['cases', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<Case>(`/cases/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: CreateCaseInput) => {
      const { token } = await getHeaders();
      return api<Case>('/cases', { method: 'POST', body: JSON.stringify(data), token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useUpdateCase(id: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: UpdateCaseInput) => {
      const { token } = await getHeaders();
      return api<Case>(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify(data), token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useResolveCase(id: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (resolution_notes?: string) => {
      const { token } = await getHeaders();
      return api<Case>(`/cases/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes }),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<{ deleted: boolean }>(`/cases/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
