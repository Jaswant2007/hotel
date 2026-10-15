export interface ApiError {
  code: string;
  message: string;
  field?: string;
  retryAfter?: number;
}

function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach CSRF token on mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfTokenFromCookie();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly cookies are sent
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const error: ApiError = {
      code: data?.code || (res.status === 429 ? 'RATE_LIMITED' : 'HTTP_ERROR'),
      message: data?.message || `Request failed with status ${res.status}`,
      field: data?.field,
      retryAfter: data?.retryAfter || (res.headers.get('Retry-After') ? parseInt(res.headers.get('Retry-After')!, 10) : undefined),
    };
    throw error;
  }

  return data as T;
}
