import { z } from 'zod';
import { adminResumeSchema, publicResumeSchema, type AdminResume } from './schemas';

export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/$/, '');
let csrf = '';
export const setCsrf = (t: string) => { csrf = t; };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const detailOf = (d: unknown): string => {
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => (x?.msg ? `${(x.loc ?? []).slice(-1)[0] ?? ''}: ${x.msg}` : '')).filter(Boolean).join('; ');
  return 'Something went wrong.';
};

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}, schema?: z.ZodType<T>): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && csrf) headers.set('X-CSRF-Token', csrf);
  let body = init.body;
  if (init.json !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(init.json); }
  let res: Response;
  try { res = await fetch(`${API_BASE}${path}`, { ...init, method, headers, body, credentials: 'include' }); }
  catch { throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.'); }
  if (!res.ok) {
    let msg = res.status === 429 ? 'Too many attempts. Please wait and try again.' : `Request failed (${res.status}).`;
    try { msg = detailOf((await res.json()).detail); } catch { /* non-JSON error */ }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  return schema ? schema.parse(data) : (data as T);
}

const session = z.object({ email: z.string(), csrf_token: z.string() });
const resumes = z.array(adminResumeSchema);

export const api = {
  publicResumes: () => request('/public/resumes', {}, z.array(publicResumeSchema)),
  publicDownloadUrl: (id: string) => `${API_BASE}/public/resumes/${id}/download`,
  adminDownloadUrl: (id: string) => `${API_BASE}/admin/resumes/${id}/download`,
  login: async (email: string, password: string) => { const s = await request('/admin/auth/login', { method: 'POST', json: { email, password } }, session); setCsrf(s.csrf_token); return s; },
  me: async () => { const s = await request('/admin/auth/me', {}, session); setCsrf(s.csrf_token); return s; },
  logout: () => request<void>('/admin/auth/logout', { method: 'POST' }),
  changePassword: async (current_password: string, new_password: string) => { const s = await request('/admin/auth/change-password', { method: 'POST', json: { current_password, new_password } }, session); setCsrf(s.csrf_token); return s; },
  stats: () => request('/admin/stats', {}, z.object({ total: z.number(), by_visibility: z.record(z.string(), z.number()), by_category: z.array(z.object({ key: z.string(), label: z.string(), count: z.number() })), total_bytes: z.number() })),
  audit: () => request('/admin/audit', {}, z.array(z.object({ action: z.string(), outcome: z.string(), created_at: z.string().nullable() }))),
  list: (p: { q?: string; category?: string; visibility?: string; sort?: string }) => {
    const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
    return request(`/admin/resumes${qs ? `?${qs}` : ''}`, {}, resumes);
  },
  history: (id: string) => request(`/admin/resumes/${id}/history`, {}, resumes),
  patch: (id: string, json: Record<string, unknown>) => request(`/admin/resumes/${id}`, { method: 'PATCH', json }, adminResumeSchema),
  action: (id: string, name: 'publish' | 'unpublish' | 'archive' | 'default', query = '') => request(`/admin/resumes/${id}/${name}${query}`, { method: 'POST' }, adminResumeSchema),
  remove: (id: string) => request<void>(`/admin/resumes/${id}`, { method: 'DELETE' }),
};

/** Multipart upload with progress (fetch cannot report upload progress). */
export function uploadForm(path: string, form: FormData, onProgress: (pct: number) => void): Promise<AdminResume> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-CSRF-Token', csrf);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, 'Upload failed: cannot reach the server.'));
    xhr.onload = () => {
      let body: unknown = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        const r = adminResumeSchema.safeParse(body);
        return r.success ? resolve(r.data) : reject(new ApiError(500, 'Unexpected server response.'));
      }
      reject(new ApiError(xhr.status, detailOf((body as { detail?: unknown } | null)?.detail) || `Upload failed (${xhr.status}).`));
    };
    xhr.send(form);
  });
}
export const createResume = (f: FormData, p: (n: number) => void) => uploadForm('/admin/resumes', f, p);
export const replaceResume = (id: string, f: FormData, p: (n: number) => void) => uploadForm(`/admin/resumes/${id}/replace`, f, p);
