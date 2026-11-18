import 'server-only';
import { ZodError } from 'zod';
import type { ApiCode, ApiResult } from './contracts';

export class ApiFailure extends Error {
  readonly code: ApiCode; readonly status: number; readonly retryable: boolean;
  constructor(code: ApiCode, message: string, status: number, retryable = false) {
    super(message); this.code = code; this.status = status; this.retryable = retryable;
  }
}
export function success<T>(data: T, status = 200) {
  return Response.json({ ok: true, data } satisfies ApiResult<T>, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function failure(error: unknown) {
  const known = error instanceof ApiFailure ? error : error instanceof ZodError
    ? new ApiFailure('INVALID_INPUT', error.issues[0]?.message ?? 'Invalid input.', 400)
    : new ApiFailure('INTERNAL_ERROR', 'The operation could not be completed. Please retry.', 500, true);
  return Response.json({ ok: false, error: { code: known.code, message: known.message, retryable: known.retryable } } satisfies ApiResult<never>,
    { status: known.status, headers: { 'Cache-Control': 'no-store' } });
}
export async function bodyJson(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ApiFailure('INVALID_INPUT', 'Send application/json.', 400);
  if (Number(request.headers.get('content-length')) > 20000) throw new ApiFailure('INVALID_INPUT', 'Request is too large.', 400);
  const body = await request.text();
  if (body.length > 20000) throw new ApiFailure('INVALID_INPUT', 'Request is too large.', 400);
  try { return JSON.parse(body) as unknown; } catch { throw new ApiFailure('INVALID_INPUT', 'Invalid JSON body.', 400); }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  if (origin && origin !== expected) throw new ApiFailure('FORBIDDEN', 'Cross-origin mutation rejected.', 403);
}
export function databaseFailure(code?: string) {
  if (code === 'PGRST301' || code === 'PGRST302') return new ApiFailure('NOT_CONFIGURED', 'Supabase rejected the Firebase token. Configure Firebase third-party Auth and the authenticated role claim.', 503);
  if (code === 'PGRST205' || code === '42P01') return new ApiFailure('NOT_CONFIGURED', 'Database tables are missing. Apply the numbered Supabase migrations in order.', 503);
  if (code === '42501') return new ApiFailure('FORBIDDEN', 'Database access denied. Check Firebase role=authenticated and owner RLS policies.', 403);
  return new ApiFailure('UPSTREAM_ERROR', 'Database operation failed. Check the migration and retry.', 502, true);
}
