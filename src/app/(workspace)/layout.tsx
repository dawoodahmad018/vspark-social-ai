import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { hasSupabase } from '@/lib/config';
import { serverSupabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const configured = hasSupabase(); let email: string | null = null;
  if (configured) {
    const client = await serverSupabase(); const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) redirect('/login'); email = user.email ?? 'Signed-in user';
  }
  return <AppShell configured={configured} email={email}>{children}</AppShell>;
}
