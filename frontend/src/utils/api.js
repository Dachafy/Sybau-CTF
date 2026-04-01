import axios from 'axios';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
const isDevelopment = process.env.NODE_ENV !== 'production';

// Challenge attachments are opened directly in the browser, so they must point
// at the backend itself in development instead of the React dev server.
export const STATIC_BASE = isDevelopment
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : window.location.origin;

export const getStaticUrl = (url) => {
  if (!url) return '';

  try {
    const parsed = new URL(url, STATIC_BASE);
    const isLocalAsset = LOCAL_HOSTS.includes(parsed.hostname);

    if (url.startsWith('/') || (isDevelopment && isLocalAsset)) {
      return `${STATIC_BASE}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return url;
  }
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Required to send session cookie cross-origin in dev
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // FIX: Don't redirect on /auth/me — that's the startup check.
      //      Redirecting there causes an infinite loop:
      //      /me → 401 → redirect to /login → AuthContext runs /me → repeat.
      //      Only redirect when a protected page gets a 401.
      const url = err.config?.url || '';
      const isAuthCheck = url.includes('/auth/me');

      if (!isAuthCheck) {
        localStorage.removeItem('token');
        // FIX: Only redirect if not already on login/register page
        const isAuthPage = window.location.pathname === '/login'
          || window.location.pathname === '/register';
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      } else {
        // Just clear the stale token, let AuthContext handle state
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
