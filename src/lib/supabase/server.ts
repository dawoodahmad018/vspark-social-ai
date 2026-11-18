import 'server-only';
import { requireUser } from '@/lib/auth/server';
/** Firebase-verified, RLS-scoped database client. */
export async function serverSupabase() { return (await requireUser()).supabase; }
