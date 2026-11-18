import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3000';
const health = await fetch(base+'/api/health').then(response => response.json());
assert.equal(health.ok, true);
for (const path of ['/dashboard','/posts','/integrations','/settings','/login','/register']) {
  const response = await fetch(base+path, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  if (!['/login','/register'].includes(path)) {
    assert.equal(response.status, 307, path); assert.equal(new URL(response.headers.get('location'),base).pathname, '/login');
    console.log(`PASS ${path}: protected redirect to login`);
  } else {
    assert.equal(response.status, 200, path); assert.ok((await response.text()).includes('v-spark'), path);
    console.log(`PASS ${path}: HTML 200`);
  }
}
const closed = 401;
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

for (const method of ['POST', 'PATCH', 'DELETE']) {
  const path = method === 'POST' ? '/api/posts' : '/api/posts/00000000-0000-4000-8000-000000000001';
  const response = await fetch(base+path, { method, headers: {'Content-Type':'application/json'}, body:'{}' });
  assert.equal(response.status,401); console.log(`PASS ${method} ${path}: 401`);
}
const invalidCookie = await fetch(base+'/api/posts', { headers:{Cookie:'vspark_identity=forged'} });
assert.ok([401,503].includes(invalidCookie.status)); console.log(`PASS forged identity: ${invalidCookie.status}`);
const logout = await fetch(base+'/api/auth/logout', {method:'POST'});
assert.equal(logout.status,200); assert.ok(logout.headers.get('set-cookie').includes('Max-Age=0'));
console.log('PASS logout clears HttpOnly session cookies');
const foreignLogin = await fetch(base+'/api/auth/login', {method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});
assert.equal(foreignLogin.status,403); console.log('PASS foreign-origin login: 403');
