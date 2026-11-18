import { AuthForm } from '@/components/auth/auth-form';
import { hasFirebase } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default function RegisterPage() { return <AuthForm mode="register" configured={hasFirebase()} />; }
