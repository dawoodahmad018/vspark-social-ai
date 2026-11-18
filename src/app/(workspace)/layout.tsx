import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { requireUser } from '@/lib/auth/server';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireUser().catch(() => null);
  if (!identity) redirect('/login');
  return <AppShell configured={true} email={identity.user.email ?? 'Signed-in user'}>{children}</AppShell>;
}
