import 'server-only';
import { ApiFailure } from '@/lib/http';
import { verifyFirebaseToken } from './verify';
import { decodeJwt } from 'jose';
import { ensureFirebaseRole } from './admin';

export const ID_COOKIE = 'vspark_identity';
export const REFRESH_COOKIE = 'vspark_refresh';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 5 };
function configuration() {
  const key = process.env.FIREBASE_API_KEY; const project = process.env.FIREBASE_PROJECT_ID;
  if (!key || !project) throw new ApiFailure('NOT_CONFIGURED', 'Firebase Authentication is not configured. See docs/MANUAL_SETUP.md.', 503);
  return { key, project };
}
export async function firebaseIdentity(token: string) {
  const { project } = configuration();
  try { return await verifyFirebaseToken(token, project); }
  catch { throw new ApiFailure('UNAUTHENTICATED', 'Your session expired. Sign in again.', 401); }
}
export async function firebaseExchange(action: 'login' | 'register' | 'refresh', input: { email?: string; password?: string; refreshToken?: string }, provision = true): Promise<{ token: string; refreshToken: string; user: { id: string; email: string | undefined } }> {
  const { key } = configuration();
  const refreshing = action === 'refresh';
  const endpoint = refreshing ? 'https://securetoken.googleapis.com/v1/token' : `https://identitytoolkit.googleapis.com/v1/accounts:${action === 'login' ? 'signInWithPassword' : 'signUp'}`;
  let response: Response;
  try {
    response = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': refreshing ? 'application/x-www-form-urlencoded' : 'application/json' },
      body: refreshing ? new URLSearchParams({ grant_type: 'refresh_token', refresh_token: input.refreshToken ?? '' }) : JSON.stringify({ email: input.email, password: input.password, returnSecureToken: true }),
    });
  } catch { throw new ApiFailure('UPSTREAM_ERROR', 'Authentication provider is unavailable. Please retry.', 502, true); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429) throw new ApiFailure('RATE_LIMITED', 'Too many authentication attempts. Wait and retry.', 429, true);
    const code = data?.error?.message;
    const message = code === 'OPERATION_NOT_ALLOWED' ? 'Enable Firebase Email/Password authentication in the Firebase console.' : code === 'EMAIL_EXISTS' ? 'An account already exists. Try signing in.' : 'Authentication failed. Check your details or sign in again.';
    throw new ApiFailure('UNAUTHENTICATED', message, 401);
  }
  const token = refreshing ? data?.id_token : data?.idToken;
  const refreshToken = refreshing ? data?.refresh_token : data?.refreshToken;
  if (typeof token !== 'string' || typeof refreshToken !== 'string') throw new ApiFailure('UPSTREAM_ERROR', 'Authentication provider returned an invalid session.', 502);
  const user = await firebaseIdentity(token);
  // Decode only AFTER signature/issuer/audience verification above.
  if (provision && decodeJwt(token).role !== 'authenticated' && await ensureFirebaseRole(user.id)) {
    return firebaseExchange('refresh', { refreshToken }, false);
  }
  return { token, refreshToken, user };
}
