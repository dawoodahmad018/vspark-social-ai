import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3000';
const health = await fetch(base+'/api/health').then(response => response.json());
assert.equal(health.ok, true);
for (const path of ['/dashboard','/posts','/integrations','/settings','/login','/register']) {
  const response = await fetch(base+path, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  if (health.data.integrations.auth.configured && !['/login','/register'].includes(path)) {
    assert.equal(response.status, 307, path); assert.equal(new URL(response.headers.get('location'),base).pathname, '/login');
    console.log(`PASS ${path}: protected redirect to login`);
  } else {
    assert.equal(response.status, 200, path); assert.ok((await response.text()).includes('v-spark'), path);
    console.log(`PASS ${path}: HTML 200`);
  }
}
const closed = health.data.integrations.auth.configured ? 401 : 503;
for (const path of ['/api/posts','/api/preferences','/api/integrations/drive/connect']) {
  const response = await fetch(base+path); assert.equal(response.status, closed, path);
  assert.equal((await response.json()).ok, false); console.log(`PASS ${path}: fails closed ${closed}`);
}
const generation = await fetch(base+'/api/captions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: 'Useful topic', platform: 'instagram', tone: 'friendly' }) });
assert.equal(generation.status, closed); console.log(`PASS /api/captions: fails closed ${closed}`);
const foreign = await fetch(base+'/api/posts', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}' });
assert.equal(foreign.status, 403); console.log('PASS foreign-origin mutation: 403');
const cron = await fetch(base+'/api/cron/notifications'); assert.ok([401,503].includes(cron.status));
console.log(`PASS cron without authorization: ${cron.status}`);
console.log('HTTP smoke checks passed. This does not test browser interactions or real integrations.');
