const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface FetchOptions extends RequestInit {
  tenantId?: string;
  token?: string;
}

export async function api<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { tenantId, token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...rest,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: { token?: string; tenantId?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.tenantId) {
    headers['X-Tenant-Id'] = options.tenantId;
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
