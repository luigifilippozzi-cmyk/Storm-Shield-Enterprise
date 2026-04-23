'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { ServiceOrder } from '@sse/shared-types';

export interface ServiceOrderFilters {
  search?: string;
  status?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedServiceOrders {
  data: ServiceOrder[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateServiceOrderInput {
  estimate_id: string;
  customer_id: string;
  vehicle_id: string;
  assigned_to?: string;
  estimated_completion?: string;
  notes?: string;
}

export type UpdateServiceOrderInput = Partial<CreateServiceOrderInput>;

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => ({ token: (await getToken()) || undefined });
}

export function useServiceOrders(filters: ServiceOrderFilters = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();

  return useQuery({
    queryKey: ['service-orders', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedServiceOrders>(`/service-orders${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useServiceOrder(id: string) {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['service-orders', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<ServiceOrder>(`/service-orders/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: CreateServiceOrderInput) => {
      const { token } = await getHeaders();
      return api<ServiceOrder>('/service-orders', { method: 'POST', body: JSON.stringify(data), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-orders'] }),
  });
}

export function useUpdateServiceOrder(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: UpdateServiceOrderInput) => {
      const { token } = await getHeaders();
      return api<ServiceOrder>(`/service-orders/${id}`, { method: 'PUT', body: JSON.stringify(data), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-orders'] }),
  });
}

export function useUpdateServiceOrderStatus(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (status: string) => {
      const { token } = await getHeaders();
      return api<ServiceOrder>(`/service-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-orders'] }),
  });
}

export function useDeleteServiceOrder() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/service-orders/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-orders'] }),
  });
}

// ── RF-006: Force progress hook (Owner only) ──

export interface ForceProgressInput {
  target_status: string;
  reason: string;
}

export function useForceProgress(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: ForceProgressInput) => {
      const { token } = await getHeaders();
      return api<ServiceOrder>(`/service-orders/${id}/force-progress`, { method: 'POST', body: JSON.stringify(data), token });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-orders', id] });
      qc.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}
