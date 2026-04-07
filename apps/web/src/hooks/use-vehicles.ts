'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api, apiUpload } from '@/lib/api';
import type { Vehicle } from '@sse/shared-types';

// ── Types ──

export interface VehicleFilters {
  search?: string;
  condition?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedVehicles {
  data: Vehicle[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateVehicleInput {
  customer_id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  mileage?: number;
  condition?: string;
  license_plate?: string;
  license_state?: string;
  insurance_company_id?: string;
  claim_number?: string;
  notes?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

// ── Helper to build auth headers ──

function useApiHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    return { token };
  };
}

// ── Hooks ──

export function useVehicles(filters: VehicleFilters = {}) {
  const getHeaders = useApiHeaders();

  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.customer_id) params.set('customer_id', filters.customer_id);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const endpoint = `/vehicles${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<PaginatedVehicles>(endpoint, { token });
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
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: CreateVehicleInput) => {
      const { token } = await getHeaders();
      return api<Vehicle>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: UpdateVehicleInput) => {
      const { token } = await getHeaders();
      return api<Vehicle>(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (id: string) => {
      const { token } = await getHeaders();
      return api<void>(`/vehicles/${id}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

// ── Vehicle Photo Hooks ──

export interface VehiclePhoto {
  id: string;
  vehicle_id: string;
  storage_key: string;
  file_name: string;
  description: string | null;
  photo_type: string;
  url?: string;
  created_at: string;
}

export function useUploadVehiclePhoto(vehicleId: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (data: { file: File; photo_type?: string; description?: string }) => {
      const { token } = await getHeaders();
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.photo_type) formData.append('photo_type', data.photo_type);
      if (data.description) formData.append('description', data.description);
      return apiUpload<VehiclePhoto>(`/vehicles/${vehicleId}/photos`, formData, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
    },
  });
}

export function useDeleteVehiclePhoto(vehicleId: string) {
  const queryClient = useQueryClient();
  const getHeaders = useApiHeaders();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { token } = await getHeaders();
      return api<void>(`/vehicles/${vehicleId}/photos/${photoId}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
    },
  });
}
