import axios from 'axios';

function getBaseApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Handle client-side browser navigation dynamically
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;

    // Cloud / Vercel preview & production deployments
    if (hostname.endsWith('.vercel.app')) {
      return 'https://campus-connect-l5ro-two.vercel.app';
    }

    // Local area network devices (e.g. mobile phones accessing http://192.168.x.x:5173 or http://10.x.x.x)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:8000`;
    }
  }

  return 'http://localhost:8000';
}

export const API_URL = getBaseApiUrl();

export const api = axios.create({
  baseURL: API_URL,
});

function inferFeatureFromUrl(url: string): string {
  if (!url) return 'Frontend';
  if (url.includes('/auth')) return 'Authentication';
  if (url.includes('/admin')) return 'Admin Panel';
  if (url.includes('/student')) return 'Student Portal';
  if (url.includes('/college')) return 'College Portal';
  if (url.includes('/company')) return 'Company / ATS';
  if (url.includes('/notifications')) return 'Notifications';
  return 'API Request';
}

const recentIssueCache = new Map<string, number>();

export async function reportFrontendIssue(payload: {
  feature: string;
  message: string;
  severity?: 'warning' | 'error' | 'critical';
  endpoint?: string;
  method?: string;
  status_code?: number;
  error_type?: string;
  stack_trace?: string;
}) {
  try {
    const key = `${payload.feature}:${payload.endpoint || ''}:${payload.status_code || ''}:${payload.message.slice(0, 80)}`;
    const now = Date.now();
    const lastSent = recentIssueCache.get(key);
    if (lastSent && now - lastSent < 8000) return;
    recentIssueCache.set(key, now);

    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/admin/issues/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        source: 'frontend',
        severity: payload.severity || 'error',
        ...payload,
      }),
    });
  } catch {
    // Never let telemetry reporting crash the app
  }
}

// Interceptor to attach the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const url = config.url || '';
  const isPublicAuthRoute = url.startsWith('/auth/login') || url.startsWith('/auth/register');
  if (token && !isPublicAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to automatically report feature/API failures to Admin Issue Monitor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url || '';
    const method: string = (error?.config?.method || 'GET').toUpperCase();
    const status: number | undefined = error?.response?.status;

    // Avoid infinite loops and ignore normal 401/403 auth rejections unless it's a server/network crash
    const shouldReport =
      !url.includes('/admin/issues') &&
      (!status || status >= 500 || status === 404);

    if (shouldReport) {
      const detail =
        typeof error?.response?.data?.detail === 'string'
          ? error.response.data.detail
          : error?.message || 'Unknown request failure';

      reportFrontendIssue({
        feature: inferFeatureFromUrl(url),
        message: detail,
        severity: !status || status >= 500 ? 'critical' : 'warning',
        endpoint: url,
        method,
        status_code: status,
        error_type: !status ? 'NetworkError' : `HTTP${status}`,
      });
    }

    return Promise.reject(error);
  }
);
