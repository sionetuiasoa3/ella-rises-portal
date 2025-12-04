// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      data?.message || data || 'An error occurred',
      response.status,
      data
    );
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  // For file uploads (multipart/form-data)
  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data?.message || 'Upload failed', response.status, data);
    }

    return data as T;
  },
};

export { ApiError };
export default api;
