'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Vehicle } from '@sse/shared-types';

export interface VehicleFilters {
  search?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedVehicles {
  data: Vehicle[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateVehicleInput {
  customer_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  vin?: string;
  mileage?: number;
  condition?: string;
  license_plate?: string;
  license_state?: string;
  insurance_company_id?: string;
  claim_number?: string;
  notes?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => ({ token: (await getToken()) || undefined });
}

export function useVehicles(filters: VehicleFilters = {}) {
  const getHeaders = useApiHeaders();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();

  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedVehicles>(`/vehicles${qs ? `?${qs}` : ''}`, { token });
    },
  });
}

export function useVehicle(id: string) {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<Vehicle>(`/vehicles/${id}`, { token });
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: CreateVehicleInput) => {
      const { token } = await getHeaders();
      return api<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: UpdateVehicleInput) => {
      const { token } = await getHeaders();
      return api<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data), token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/vehicles/${id}`, { method: 'DELETE', token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
