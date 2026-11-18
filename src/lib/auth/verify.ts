import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export async function verifyFirebaseToken(token: string, projectId: string, key: JWTVerifyGetKey = googleKeys) {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['RS256'], audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
    requiredClaims: ['exp', 'iat', 'auth_time', 'sub'],
  });
  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || payload.sub.length > 128 || typeof payload.iat !== 'number' || payload.iat > now ||
      typeof payload.auth_time !== 'number' || payload.auth_time > now) throw new Error('Invalid Firebase identity.');
  return { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
}
