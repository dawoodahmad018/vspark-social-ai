'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { apiRequest } from '@/lib/client';

export function AuthForm({ mode, configured }: { mode: 'login' | 'register'; configured: boolean }) {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await apiRequest(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password }) });
      router.replace('/dashboard'); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Authentication failed. Please retry.'); }
    finally { setBusy(false); }
  }
  return <div className="auth-screen"><div className="auth-story"><Link className="brand" href="/dashboard"><span className="brand-symbol">✳</span>v-spark</Link><div><p className="eyebrow">YOUR IDEAS. MORE POSSIBILITIES.</p><h1>Good content<br />starts with<br /><em>a little spark.</em></h1><p>Create thoughtful captions. Plan your next post.<br />Keep your ideas moving forward.</p></div><span>V-SPARK 2026 · SOCIAL STUDIO</span></div><main className="auth-main"><div className="auth-card"><p className="eyebrow">WELCOME TO YOUR WORKSPACE</p><h1>{mode === 'login' ? 'Welcome back.' : 'Make room for your ideas.'}</h1><p>{mode === 'login' ? 'Sign in to create and manage your content.' : 'Create an account for your personal content studio.'}</p>{!configured && <div className="alert">Firebase credentials are not configured. Accounts are unavailable until setup is complete.</div>}<form onSubmit={submit} className="stack"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" />{error && <p role="alert" className="error-text">{error}</p>}{message && <p role="status" className="success-text">{message}</p>}<button className="button primary full" disabled={!configured || busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}</button></form><p className="auth-switch">{mode === 'login' ? 'New here?' : 'Already have an account?'} <Link href={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p><Link className="text-button" href="/integrations">View integration setup ↗</Link></div></main></div>;
}
