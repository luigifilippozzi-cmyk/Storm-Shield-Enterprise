'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ActivationRate {
  activated: number;
  total: number;
  rate: number;
}

interface FunnelStep {
  event_type: string;
  count: number;
  rate: number;
}

interface RecentEvent {
  id: string;
  tenant_id: string;
  user_id: string | null;
  event_type: string;
  occurred_at: string;
}

async function fetchAdmin<T>(path: string, adminKey: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-sse-admin-key': adminKey },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const EVENT_LABELS: Record<string, string> = {
  tenant_created: 'Tenants criados',
  first_user_login: 'Primeiro login',
  first_customer_created: 'Primeiro customer',
  first_vehicle_created: 'Primeiro veículo',
  first_estimate_created: 'Primeiro estimate',
  first_service_order_created: 'Primeira SO',
  first_financial_transaction_created: 'Primeira transação',
  tenant_activated: 'Ativados (happy path)',
};

export default function ActivationDashboardPage() {
  const [adminKey, setAdminKey] = useState('');
  const [period, setPeriod] = useState(30);
  const [rate, setRate] = useState<ActivationRate | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [recent, setRecent] = useState<RecentEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!adminKey) { setError('Informe o admin key'); return; }
    setLoading(true);
    setError('');
    try {
      const [r, f, rec] = await Promise.all([
        fetchAdmin<ActivationRate>(`/admin/activation/rate?period=${period}`, adminKey),
        fetchAdmin<FunnelStep[]>(`/admin/activation/funnel?period=${period}`, adminKey),
        fetchAdmin<RecentEvent[]>('/admin/activation/recent', adminKey),
      ]);
      setRate(r);
      setFunnel(f);
      setRecent(rec);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activation Dashboard</h1>
        <span className="text-xs text-muted-foreground bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          Internal — Admin only
        </span>
      </div>

      {/* Auth + controls */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Admin Key</label>
          <input
            type="password"
            placeholder="SSE_ADMIN_KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Período</label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Carregar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>
      )}

      {rate && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total de tenants</p>
              <p className="text-3xl font-bold mt-1">{rate.total}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tenants ativados</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{rate.activated}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Activation rate</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">
                {(rate.rate * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">happy path em 7 dias</p>
            </div>
          </div>

          {/* Funnel */}
          {funnel.length > 0 && (
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Funil de Ativação — últimos {period} dias</h2>
              <div className="space-y-2">
                {funnel.map((step) => (
                  <div key={step.event_type} className="flex items-center gap-3">
                    <span className="text-sm w-56 shrink-0">
                      {EVENT_LABELS[step.event_type] ?? step.event_type}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-4 bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(step.rate * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm w-20 text-right">
                      {step.count} ({(step.rate * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent events */}
          {recent.length > 0 && (
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Últimos 50 eventos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Evento</th>
                      <th className="pb-2 pr-4">Tenant ID</th>
                      <th className="pb-2">Ocorrido em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((ev) => (
                      <tr key={ev.id} className="border-b last:border-0">
                        <td className="py-1.5 pr-4 font-mono text-xs">{ev.event_type}</td>
                        <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                          {ev.tenant_id}
                        </td>
                        <td className="py-1.5 text-xs text-muted-foreground">
                          {new Date(ev.occurred_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
