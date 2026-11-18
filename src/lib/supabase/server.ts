import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hasSupabase } from '@/lib/config';
import { ApiFailure } from '@/lib/http';

export async function serverSupabase() {
  if (!hasSupabase()) throw new ApiFailure('NOT_CONFIGURED', 'Configure Supabase to use accounts and saved posts.', 503);
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Proxy refreshes cookies for Server Components. */ } },
    },
  });
}
