import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { firebaseIdentity, firebaseExchange, ID_COOKIE, REFRESH_COOKIE, cookieOptions } from './firebase';
import { ApiFailure } from '@/lib/http';
export async function requireUser() {
  const store = await cookies();
  let token = store.get(ID_COOKIE)?.value;
  if (!token) throw new ApiFailure('UNAUTHENTICATED', 'Sign in to continue.', 401);
  let user;
  try { user = await firebaseIdentity(token); }
  catch (error) {
    if (!(error instanceof ApiFailure) || error.status !== 401) throw error;
    const refreshToken = store.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) throw error;
    const session = await firebaseExchange('refresh', { refreshToken });
    token = session.token; user = session.user;
    try { store.set(ID_COOKIE, token, cookieOptions); store.set(REFRESH_COOKIE, session.refreshToken, cookieOptions); } catch { /* Proxy persists refreshed page sessions. */ }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ApiFailure('NOT_CONFIGURED', 'Supabase database is not configured.', 503);
  const accessToken = token;
  const supabase = createClient(url, key, { accessToken: async () => accessToken, auth: { persistSession: false, autoRefreshToken: false } });
  return { supabase, user };
}
