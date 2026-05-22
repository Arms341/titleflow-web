// JARVIS App — Axios API client  v2.0.1
// Locked template — JARVIS frontend auth.
// Single instance used by all hooks and queries.
// Auth token injected via request interceptor — never passed manually.
// OAuth2 logout redirect on 401.
//
// v2.0.1: FIX — removed default Content-Type from axios.create().
//         Axios auto-detects Content-Type from data type:
//           - Object/Array → application/json
//           - URLSearchParams → application/x-www-form-urlencoded
//         Hardcoding 'application/json' blocked URLSearchParams detection,
//         causing /auth/login to send form data with wrong Content-Type → 401.
// v2.0.0: DEBT #22 fix — endpoint uses /auth/login (OAuth2 form grant),
//         default port 8765.
import axios from 'axios';

const TOKEN_KEY = 'build_real_0521_2143-token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8765',
});

// ── Request: attach Bearer token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 globally ────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Only redirect if not already on a public page
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          !window.location.pathname.startsWith('/shared')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth helpers ──────────────────────────────────────────────────────────────

/** POST /auth/login — OAuth2 password grant (form-encoded, not JSON). */
export async function apiLogin(username: string, password: string) {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const res = await api.post<{ access_token: string; token_type: string }>(
    '/auth/login',
    form,
  );
  return res.data;
}

export async function apiRegister(data: Record<string, unknown>) {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function apiGetMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

export const TOKEN_STORAGE_KEY = TOKEN_KEY;

export default api;
