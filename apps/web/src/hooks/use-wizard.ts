'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

export interface WizardStatus {
  wizard_status: 'pending' | 'completed' | 'skipped';
  wizard_completed_at: string | null;
}

export interface InsuranceSeed {
  name: string;
  code: string;
  phone: string;
  is_drp: boolean;
}

function useWizardHeaders() {
  const { getToken, orgId } = useAuth();
  return async () => {
    const token = (await getToken()) || undefined;
    const headers: Record<string, string> = {};
    if (orgId) headers['X-Clerk-Org-Id'] = orgId;
    return { token, headers };
  };
}

export function useWizardStatus() {
  const getHeaders = useWizardHeaders();
  return useQuery<WizardStatus>({
    queryKey: ['wizard-status'],
    queryFn: async () => {
      const { token, headers } = await getHeaders();
      return api<WizardStatus>('/tenants/me/wizard/status', { token, headers });
    },
    staleTime: 60 * 1000,
  });
}

export function useInsuranceSeedList() {
  const getHeaders = useWizardHeaders();
  return useQuery<InsuranceSeed[]>({
    queryKey: ['insurance-seed-list'],
    queryFn: async () => {
      const { token } = await getHeaders();
      return api<InsuranceSeed[]>('/insurance/seed-list', { token });
    },
    staleTime: Infinity,
  });
}

export function useWizardActions() {
  const queryClient = useQueryClient();
  const getHeaders = useWizardHeaders();

  const startWizard = useMutation({
    mutationFn: async () => {
      const { token, headers } = await getHeaders();
      return api('/tenants/me/wizard/start', { method: 'POST', body: '{}', token, headers });
    },
  });

  const recordStep = useMutation({
    mutationFn: async (step: number) => {
      const { token, headers } = await getHeaders();
      return api('/tenants/me/wizard/step', {
        method: 'POST',
        body: JSON.stringify({ step }),
        token,
        headers,
      });
    },
  });

  const completeWizard = useMutation({
    mutationFn: async () => {
      const { token, headers } = await getHeaders();
      return api<WizardStatus>('/tenants/me/wizard/complete', {
        method: 'POST',
        body: '{}',
        token,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizard-status'] });
    },
  });

  const skipWizard = useMutation({
    mutationFn: async () => {
      const { token, headers } = await getHeaders();
      return api<WizardStatus>('/tenants/me/wizard/skip', {
        method: 'POST',
        body: '{}',
        token,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizard-status'] });
    },
  });

  return { startWizard, recordStep, completeWizard, skipWizard };
}
