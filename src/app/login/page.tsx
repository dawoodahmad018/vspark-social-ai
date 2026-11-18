import { AuthForm } from '@/components/auth/auth-form';
import { hasSupabase } from '@/lib/config';
export default function LoginPage() { return <AuthForm mode="login" configured={hasSupabase()} />; }
