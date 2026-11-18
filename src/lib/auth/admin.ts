import 'server-only';
import { importPKCS8, SignJWT } from 'jose';
import { ApiFailure } from '@/lib/http';

let cached: { token: string; until: number } | undefined;
/** Used only after verifying a Firebase identity, never with a client-supplied UID. */
export async function ensureFirebaseRole(uid: string) {
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const project = process.env.FIREBASE_PROJECT_ID;
  if (!email || !privateKey || !project) return false;
  try {
    if (!cached || cached.until < Date.now()) {
      const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/identitytoolkit' })
        .setProtectedHeader({ alg: 'RS256' }).setIssuer(email).setSubject(email)
        .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h')
        .sign(await importPKCS8(privateKey, 'RS256'));
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.access_token !== 'string') throw new Error('Admin authorization failed');
      cached = { token: data.access_token, until: Date.now() + 50 * 60 * 1000 };
    }
    const headers = { Authorization: `Bearer ${cached.token}`, 'Content-Type': 'application/json' };
    const base = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(project)}/accounts`;
    // Preserve any existing custom claims; never overwrite unrelated authorization.
    const lookup = await fetch(`${base}:lookup`, { method: 'POST', headers, body: JSON.stringify({ localId: [uid] }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const record = await lookup.json();
    if (!lookup.ok || record.users?.[0]?.localId !== uid) throw new Error('Admin lookup failed');
    const claims = JSON.parse(record.users[0].customAttributes || '{}');
    const update = await fetch(`${base}:update`, { method: 'POST', headers, body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ ...claims, role: 'authenticated' }) }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!update.ok) throw new Error('Claim update failed');
    return true;
  } catch { throw new ApiFailure('UPSTREAM_ERROR', 'Firebase account authenticated, but database access setup failed. Check the Firebase service-account permissions, then sign in again.', 502, true); }
}
