import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyFirebaseToken } from '../src/lib/auth/verify.ts';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const key = async () => publicKey;
const project = 'local-test-project';
async function token(overrides = {}) {
  const now = Math.floor(Date.now()/1000);
  return new SignJWT({ sub: 'firebase-string-uid', email: 'tester@example.com', auth_time: now, iat: now, exp: now+3600, aud: project, iss: `https://securetoken.google.com/${project}`, ...overrides }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(privateKey);
}
test('Firebase verifier accepts a signed identity and preserves string UID', async () => {
  assert.deepEqual(await verifyFirebaseToken(await token(), project, key), { id: 'firebase-string-uid', email: 'tester@example.com' });
});
test('Firebase verifier rejects wrong project, issuer, expired and future identity', async () => {
  for (const claims of [{aud:'other'}, {iss:'https://attacker.example'}, {exp:1}, {auth_time:Math.floor(Date.now()/1000)+3600}, {sub:''}]) {
    await assert.rejects(() => token(claims).then(value => verifyFirebaseToken(value, project, key)));
  }
});
test('Firebase verifier rejects tampering and unsigned tokens', async () => {
  const signed = await token();
  const [header,, signature] = signed.split('.');
  const tampered = `${header}.${Buffer.from(JSON.stringify({sub:'attacker'})).toString('base64url')}.${signature}`;
  await assert.rejects(() => verifyFirebaseToken(tampered, project, key));
  await assert.rejects(() => verifyFirebaseToken('eyJhbGciOiJub25lIn0.e30.', project, key));
});
