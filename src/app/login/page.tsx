import { AuthForm } from '@/components/auth/auth-form';
import { hasFirebase } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default function LoginPage() { return <AuthForm mode="login" configured={hasFirebase()} />; }
