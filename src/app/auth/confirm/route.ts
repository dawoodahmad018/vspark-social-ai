import { NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url); const token_hash = url.searchParams.get('token_hash');
  if (token_hash && url.searchParams.get('type') === 'email') {
    try { const supabase = await serverSupabase(); const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'email' }); if (!error) return NextResponse.redirect(new URL('/dashboard', request.url)); } catch { /* Return to sign-in without leaking token details. */ }
  }
  return NextResponse.redirect(new URL('/login?confirmation=failed', request.url));
}
