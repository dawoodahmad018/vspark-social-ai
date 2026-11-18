'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '@/lib/client';
import type { NotificationPreferences } from '@/lib/contracts';
export function PreferencesForm({ configured }: { configured: boolean }) {
  const [preferences,setPreferences] = useState<NotificationPreferences>({ enabled: false, recipient_email: '', lead_minutes: 0, include_caption: true });
  const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [message,setMessage] = useState('');
  useEffect(() => { if (!configured) return; const controller = new AbortController(); apiRequest<{ preferences: NotificationPreferences }>('/api/preferences', { signal: controller.signal }).then(data => setPreferences(data.preferences)).catch(reason => { if (!controller.signal.aborted) setError(reason.message); }); return () => controller.abort(); }, [configured]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await apiRequest('/api/preferences', { method: 'PATCH', body: JSON.stringify(preferences) }); setMessage('Preferences saved. Email dispatch remains unavailable until the worker and provider are implemented.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Preferences could not be saved.'); } finally { setBusy(false); }
  }
  return <section className="panel settings-panel"><h2>Email notification preferences</h2><p>Choose who receives reminders and what they contain.</p><form onSubmit={submit} className="stack"><label className="checkbox-row"><input type="checkbox" checked={preferences.enabled} onChange={event => setPreferences({ ...preferences, enabled: event.target.checked })} />Request reminders for scheduled posts</label><label htmlFor="recipient">Notification recipient</label><input id="recipient" type="email" required maxLength={254} value={preferences.recipient_email} onChange={event => setPreferences({ ...preferences, recipient_email: event.target.value })} placeholder="recipient@example.com" /><label htmlFor="lead">Minutes before scheduled time</label><input id="lead" type="number" min={0} max={1440} required value={preferences.lead_minutes} onChange={event => setPreferences({ ...preferences, lead_minutes: Number(event.target.value) })} /><label className="checkbox-row"><input type="checkbox" checked={preferences.include_caption} onChange={event => setPreferences({ ...preferences, include_caption: event.target.checked })} />Include caption and task details</label>{error && <p role="alert" className="error-text">{error}</p>}{message && <p role="status" className="success-text">{message}</p>}<button className="button primary" disabled={!configured || busy}>{busy ? 'Saving…' : 'Save preferences'}</button></form><div className="integration-footnote"><span>↗</span><p>Email delivery is not active. A verified sender, secure scheduler and dispatch worker are required.</p></div></section>;
}
