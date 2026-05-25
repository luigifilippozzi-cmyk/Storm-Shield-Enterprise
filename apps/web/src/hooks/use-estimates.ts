'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api, apiUpload } from '@/lib/api';
import type { Estimate } from '@sse/shared-types';

export interface EstimateFilters {
  search?: string;
  status?: string;
  statuses?: string;
  customer_id?: string;
  vehicle_id?: string;
  insurance_company_id?: string;
  scope?: 'mine' | 'all';
  date_from?: string;
  date_to?: string;
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
  const { getToken, orgId } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    const headers: Record<string, string> = {};
    if (orgId) headers['X-Clerk-Org-Id'] = orgId;
    return { token, headers };
  };
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
      const { token, headers } = await getHeaders();
      return api<PaginatedEstimates>(`/estimates${qs ? `?${qs}` : ''}`, { token, headers });
    },
  });
}

export function useEstimate(id: string) {
  const getHeaders = useApiHeaders();
  return useQuery({
    queryKey: ['estimates', id],
    queryFn: async () => {
      const { token, headers } = await getHeaders();
      return api<Estimate>(`/estimates/${id}`, { token, headers });
    },
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: CreateEstimateInput) => {
      const { token, headers } = await getHeaders();
      return api<Estimate>('/estimates', { method: 'POST', body: JSON.stringify(data), token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useUpdateEstimate(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: UpdateEstimateInput) => {
      const { token, headers } = await getHeaders();
      return api<Estimate>(`/estimates/${id}`, { method: 'PUT', body: JSON.stringify(data), token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useUpdateEstimateStatus(id: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (status: string) => {
      const { token, headers } = await getHeaders();
      return api<Estimate>(`/estimates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useUpdateEstimateStatusById() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { token, headers } = await getHeaders();
      return api<Estimate>(`/estimates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }), token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

export function useDeleteEstimate() {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (id: string) => {
      const { token, headers } = await getHeaders();
      return api<void>(`/estimates/${id}`, { method: 'DELETE', token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates'] }),
  });
}

/** Convenience hook: all estimates linked to a specific vehicle (B1-3). */
export function useVehicleEstimates(vehicleId: string) {
  return useEstimates({
    vehicle_id: vehicleId,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
  });
}

// ── Estimate Document Hooks ──

export interface EstimateDocument {
  id: string;
  estimate_id: string;
  storage_key: string;
  file_name: string;
  document_type: string;
  created_at: string;
}

export function useUploadEstimateDocument(estimateId: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: { file: File; document_type?: string }) => {
      const { token, headers } = await getHeaders();
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.document_type) formData.append('document_type', data.document_type);
      return apiUpload<EstimateDocument>(`/estimates/${estimateId}/documents`, formData, { token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates', estimateId] }),
  });
}

export function useDeleteEstimateDocument(estimateId: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { token, headers } = await getHeaders();
      return api<void>(`/estimates/${estimateId}/documents/${documentId}`, { method: 'DELETE', token, headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates', estimateId] }),
  });
}

// ── Estimate Supplement Hooks ──

export interface SupplementInput {
  reason: string;
  amount: number;
}

export interface EstimateSupplementData {
  id: string;
  estimate_id: string;
  supplement_number: number;
  reason: string;
  amount: string;
  status: string;
  requested_by: string;
  created_at: string;
}

export function useCreateSupplement(estimateId: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: SupplementInput) => {
      const { token, headers } = await getHeaders();
      return api<EstimateSupplementData>(`/estimates/${estimateId}/supplements`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
        headers,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estimates', estimateId] }),
  });
}

// ── RF-006: Dispute hooks ──

export interface OpenDisputeInput {
  dispute_reason: string;
  dispute_notes?: string;
}

export interface ResolveDisputeInput {
  resolution_status: string;
  notes?: string;
}

export function useOpenDispute(estimateId: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: OpenDisputeInput) => {
      const { token, headers } = await getHeaders();
      return api<Estimate>(`/estimates/${estimateId}/dispute`, { method: 'POST', body: JSON.stringify(data), token, headers });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', estimateId] });
      qc.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

export function useResolveDispute(estimateId: string) {
  const qc = useQueryClient();
  const getHeaders = useApiHeaders();
  return useMutation({
    mutationFn: async (data: ResolveDisputeInput) => {
      const { token, headers } = await getHeaders();
      return api<Estimate>(`/estimates/${estimateId}/resolve-dispute`, { method: 'POST', body: JSON.stringify(data), token, headers });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', estimateId] });
      qc.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}
