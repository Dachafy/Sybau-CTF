import axios from 'axios';

// Base URL for static assets (images, attachments)
export const STATIC_BASE = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: '/api',
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;