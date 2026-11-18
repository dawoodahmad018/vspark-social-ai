'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { browserSupabase } from '@/lib/supabase/browser';
const links = [{ href: '/dashboard', icon: '✦', title: 'Create content' }, { href: '/posts', icon: '▤', title: 'Saved posts' }, { href: '/integrations', icon: '⌘', title: 'Integrations' }, { href: '/settings', icon: '☷', title: 'Settings' }];
export function AppShell({ children, email, configured }: { children: React.ReactNode; email: string | null; configured: boolean }) {
  const path = usePathname(); const router = useRouter();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError('');
    try { const { error } = await browserSupabase().auth.signOut(); if (error) throw error; router.replace('/login'); router.refresh(); }
    catch { setError('Could not sign out. Please retry.'); } finally { setBusy(false); }
  }
  return <div className="app-frame"><aside className="sidebar">
    <Link href="/dashboard" className="brand"><span className="brand-symbol">✳</span><span>v-spark<span className="brand-sub">SOCIAL STUDIO</span></span></Link><p className="nav-label">WORKSPACE</p>
    <nav aria-label="Main navigation">{links.map(link => <Link key={link.href} href={link.href} className={`nav-item ${path === link.href ? 'active' : ''}`}><span aria-hidden="true">{link.icon}</span>{link.title}{path === link.href && <span className="nav-dot" />}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="small-note"><span className="eyebrow">A LITTLE SPARK GOES FAR</span><p>Good ideas deserve<br />a little consistency.</p><span className="decor-spark">✦</span></div><div className="account"><span className="avatar">{email ? email[0].toUpperCase() : 'V'}</span><div><strong>{email ? 'Your workspace' : 'Setup workspace'}</strong><small>{email ?? 'Connect services to begin'}</small></div></div>
      {email ? <button className="text-button" onClick={logout} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button> : <Link className="text-button" href="/login">Sign in →</Link>}{error && <p role="alert" className="error-text">{error}</p>}</div>
    </aside><div className="main-frame"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{links.find(link => link.href === path)?.title ?? 'Overview'}</strong></div><div className="topbar-right"><span className={`status-dot ${configured ? '' : 'muted'}`} /><span>{configured ? 'Account services configured' : 'Setup required'}</span><span className="avatar small">V</span></div></header>
      {!configured && <div className="setup-banner"><strong>Let’s connect your workspace.</strong><span> No credentials are configured. Nothing is generated, saved, uploaded or sent until services are connected.</span><Link href="/integrations">View setup →</Link></div>}
      <main className="page-content">{children}</main><footer className="footer">V-Spark Social Studio <span>Made for ideas worth sharing.</span></footer></div></div>;
}
