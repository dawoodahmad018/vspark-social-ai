import test from 'node:test';
import assert from 'node:assert/strict';
import { seal, unseal } from '../src/lib/drive/crypto.ts';
test('Drive credentials encrypted with randomized authenticated encryption',()=>{
 const key='12'.repeat(32),value={refresh_token:'local-test-only',uid:'test-user'};
 const a=seal(value,key),b=seal(value,key);
 assert.notEqual(a,b);assert.deepEqual(unseal(a,key),value);
 assert.throws(()=>unseal(a,'34'.repeat(32)));
 const bytes=Buffer.from(a,'base64url');bytes[bytes.length-1]^=1;
 assert.throws(()=>unseal(bytes.toString('base64url'),key));
 assert.throws(()=>seal(value,'invalid'));
});
