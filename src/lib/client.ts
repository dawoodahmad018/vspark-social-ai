import type { ApiResult } from './contracts';
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers }, signal: options.signal ?? AbortSignal.timeout(30000) });
  } catch { throw new Error('Request failed or timed out. Check your connection and retry.'); }
  const payload: ApiResult<T> = await response.json().catch(() => { throw new Error(`Server returned an unreadable response (${response.status}).`); });
  if (!payload.ok) throw new Error(payload.error.message);
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  return payload.data;
}
