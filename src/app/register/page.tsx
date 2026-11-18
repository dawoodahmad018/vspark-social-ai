import { AuthForm } from '@/components/auth/auth-form';
import { hasSupabase } from '@/lib/config';
export default function RegisterPage() { return <AuthForm mode="register" configured={hasSupabase()} />; }
