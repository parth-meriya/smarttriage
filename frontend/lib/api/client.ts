const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('smarttriage_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutMs = isFormData ? 15000 : 5000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response wasn't JSON
      }
      throw new ApiError(
        errorData?.detail || `API request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}
