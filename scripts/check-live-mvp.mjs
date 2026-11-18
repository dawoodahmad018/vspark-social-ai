// Creates disposable Firebase users, exercises real API persistence if configured,
// then deletes test posts/accounts. Never prints passwords, cookies or credentials.
// node --env-file=.env.local scripts/check-live-mvp.mjs
import { randomUUID } from 'node:crypto';
import { decodeJwt } from 'jose';
const base = process.argv[2] || 'http://localhost:3000';
const accounts = []; const posts = [];
async function request(path, method='GET', body, cookie) {
  const response = await fetch(base+path, {method, headers:{'Content-Type':'application/json', ...(cookie ? {Cookie:cookie}: {})}, body:body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(60000)});
  const data = await response.json().catch(()=>null);
  return {response,data};
}
async function account() {
  const input = {email:`vspark-check-${randomUUID()}@example.test`,password:randomUUID()+'Aa1!'};
  const result = await request('/api/auth/register','POST',input);
  if (!result.data?.ok) throw new Error(`Registration failed: HTTP ${result.response.status}, ${result.data?.error?.code ?? 'unknown'}`);
  const cookies = result.response.headers.getSetCookie().map(value=>value.split(';')[0]);
  const identity = cookies.find(value=>value.startsWith('vspark_identity='))?.slice('vspark_identity='.length);
  const record = {cookie:cookies.join('; '), token:decodeURIComponent(identity || ''), input}; accounts.push(record);
  console.log('PASS real Firebase registration and verified HttpOnly session');
  return record;
}
try {
  if (!process.env.FIREBASE_API_KEY || !process.env.FIREBASE_PROJECT_ID) throw new Error('Firebase environment missing');
  const first = await account();
  const login = await request('/api/auth/login','POST',first.input);
  if (!login.data?.ok) throw new Error(`Login failed: HTTP ${login.response.status}`);
  console.log('PASS real Firebase password login');
  const refreshed = await request('/api/auth/refresh','POST',undefined,first.cookie);
  if (!refreshed.data?.ok) throw new Error(`Refresh failed: HTTP ${refreshed.response.status}`);
  console.log('PASS real Firebase token refresh');
  const draft = {prompt:'Disposable verification content',caption:'Verification draft #test',platform:'instagram',scheduled_at:null,timezone:'Asia/Karachi',status:'draft',attachment_path:null};
  const created = await request('/api/posts','POST',draft,first.cookie);
  if (!created.data?.ok) {
    console.log(`Firebase database role present: ${decodeJwt(first.token).role === 'authenticated'}`);
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const diagnostic = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=id&limit=0`, {headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${first.token}`},signal:AbortSignal.timeout(15000)});
      const details = await diagnostic.json().catch(()=>null);
      console.log(`Supabase diagnostic: HTTP ${diagnostic.status}, code ${details?.code ?? 'none'} (no response data printed)`);
    }
    throw new Error(`Database create blocked: HTTP ${created.response.status}, ${created.data?.error?.code}. Check migrations, Firebase third-party Auth and authenticated role claim.`);
  }
  const post = created.data.data.post; posts.push({id:post.id,cookie:first.cookie});
  const listed = await request('/api/posts','GET',undefined,first.cookie);
  if (!listed.data?.data?.posts.some(value=>value.id===post.id)) throw new Error('Saved post not returned on reload');
  console.log('PASS real database create and reload/list');
  const second = await account();
  const other = await request('/api/posts','GET',undefined,second.cookie);
  if (!other.data?.ok || other.data.data.posts.some(value=>value.id===post.id)) throw new Error('User isolation failed');
  const denied = await request(`/api/posts/${post.id}`,'DELETE',undefined,second.cookie);
  if (denied.response.status !== 404) throw new Error('Cross-user deletion was not denied');
  console.log('PASS two-user API ownership isolation (direct RLS tests still required)');
  const rlsHeaders = {apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${second.token}`,'Content-Type':'application/json'};
  const rlsRead = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?id=eq.${post.id}&select=id`,{headers:rlsHeaders});
  if (!rlsRead.ok || (await rlsRead.json()).length !== 0) throw new Error('Direct RLS read isolation failed');
  const rlsSpoof = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts`, {method:'POST',headers:rlsHeaders,body:JSON.stringify({...draft,user_id:post.user_id})});
  if (rlsSpoof.status !== 403) throw new Error('Direct RLS spoofed owner insert not denied');
  console.log('PASS direct Supabase RLS cross-user read and spoofed insert denial');
  const edited = await request(`/api/posts/${post.id}`,'PATCH',{...draft,caption:'Updated verification #test',scheduled_at:new Date(Date.now()+3600000).toISOString(),status:'scheduled',expected_updated_at:post.updated_at},first.cookie);
  if (!edited.data?.ok) throw new Error(`Edit failed: HTTP ${edited.response.status}`);
  const conflict = await request(`/api/posts/${post.id}`,'PATCH',{...draft,expected_updated_at:post.updated_at},first.cookie);
  if (conflict.response.status !== 409) throw new Error('Stale edit not rejected');
  console.log('PASS real edit/schedule and stale-write conflict');
  const generated = await request('/api/captions','POST',{topic:'Organizing study notes',platform:'instagram',tone:'friendly'},first.cookie);
  if (!generated.data?.ok) throw new Error(`Authenticated Gemini blocked: HTTP ${generated.response.status}, ${generated.data?.error?.code}`);
  if (![2,3].includes(generated.data.data.captions.length)) throw new Error('Invalid caption count');
  console.log('PASS authenticated Gemini generation with database quota');
} catch (error) { console.log(`BLOCKED: ${error.message}`); process.exitCode=1; }
finally {
  for (const post of posts) {
    try { const result=await request(`/api/posts/${post.id}`,'DELETE',undefined,post.cookie); console.log(result.data?.ok ? 'PASS disposable database post deleted' : 'MANUAL CLEANUP: disposable post deletion failed'); }
    catch {console.log('MANUAL CLEANUP: disposable post deletion failed');}
  }
  for (const user of accounts) {
    try {
      const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:user.token}),signal:AbortSignal.timeout(15000)});
      console.log(response.ok ? 'PASS disposable Firebase account deleted' : 'MANUAL CLEANUP: remove vspark-check-* user in Firebase Console');
    } catch {console.log('MANUAL CLEANUP: remove vspark-check-* user in Firebase Console');}
  }
}
