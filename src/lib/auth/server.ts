import 'server-only';
import { serverSupabase } from '@/lib/supabase/server';
import { ApiFailure } from '@/lib/http';
export async function requireUser() {
  const supabase = await serverSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ApiFailure('UNAUTHENTICATED', 'Sign in to continue.', 401);
  return { supabase, user };
}
