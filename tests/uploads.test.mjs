import test from 'node:test';
import assert from 'node:assert/strict';
import { detectUpload, MAX_UPLOAD_BYTES } from '../src/lib/uploads/validation.ts';
test('upload signature and declared MIME must agree; active/unknown content rejected',()=>{
  assert.equal(detectUpload(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png').extension,'png');
  assert.throws(()=>detectUpload(new Uint8Array([137,80,78,71,13,10,26,10]),'application/pdf'));
  assert.throws(()=>detectUpload(new TextEncoder().encode('<svg onload="alert(1)"/>'),'image/svg+xml'));
  assert.throws(()=>detectUpload(new Uint8Array(),'image/png'));
  assert.throws(()=>detectUpload(new Uint8Array(MAX_UPLOAD_BYTES+1),'image/png'));
});
