import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
function key(value: string) { if (!/^[a-f\d]{64}$/i.test(value)) throw new Error('TOKEN_ENCRYPTION_KEY must contain 64 hex characters.'); return Buffer.from(value,'hex'); }
export function seal(value: unknown, secret: string) {
  const iv=randomBytes(12); const cipher=createCipheriv('aes-256-gcm',key(secret),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
}
export function unseal<T>(value: string, secret: string): T {
  const data=Buffer.from(value,'base64url');
  if(data.length<29) throw new Error('Invalid encrypted data');
  const decipher=createDecipheriv('aes-256-gcm',key(secret),data.subarray(0,12));
  decipher.setAuthTag(data.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8')) as T;
}
