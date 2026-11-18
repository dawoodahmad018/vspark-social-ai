import 'server-only';
import type { IntegrationStatus } from './contracts';

export function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export function hasFirebase() { return Boolean(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID); }
export function integrationStatus(): IntegrationStatus {
  return {
    auth: { configured: hasFirebase() && hasSupabase(), implemented: true, label: 'Firebase Auth + Supabase Postgres' },
    gemini: { configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL), implemented: true, label: 'Gemini captions' },
    drive: { configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.TOKEN_ENCRYPTION_KEY), implemented: false, label: 'Google Drive' },
    email: { configured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), implemented: false, label: 'Email reminders' },
    uploads: { configured: hasSupabase(), implemented: false, label: 'Private file uploads' },
  };
}
