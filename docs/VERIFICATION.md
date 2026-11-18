# MVP verification - 18 November 2026

## Current result

The existing Next.js project was extended, not replaced. Initial checkpoint:
`78c87d3`. All code changes are inside vspark-social-ai; the parent Expo source
was not edited. A new passing checkpoint is recorded by `git log -1 --oneline`.

Firebase is the active auth provider because organizer approval for Supabase Auth
was not confirmed. Existing API/data envelopes and Post types are preserved;
user_id now represents a Firebase string UID, not an auth.users UUID.

## Observed checks

| Check | Actual result |
| --- | --- |
| Dependency install | Added only jose 6.2.17; package-lock updated |
| TypeScript | PASS: npm.cmd run typecheck |
| Tests | PASS: 7 tests, 0 failures |
| Lint | PASS: npm.cmd run lint |
| Production build | PASS: final Next 16.4.6 production build, all routes compiled |
| Production HTTP | Login/register 200; all four workspace pages redirect 307 to /login |
| Anonymous API access | GET posts/preferences/Drive connect and POST captions return 401 |
| Anonymous post mutations | POST/PATCH/DELETE return 401 |
| Forged session cookie | Rejected, 401 |
| Cross-origin writes | Posts and auth login reject foreign Origin, 403 |
| Logout | 200; clears HttpOnly session cookies with Max-Age=0 |
| Cron without Bearer authorization | 401 with configured secret; no email sent |
| Real Firebase registration | PASS: disposable user created through local app API and Google provider |
| Real Firebase password login | PASS |
| Real Firebase refresh | PASS: provider exchange and verified identity |
| Disposable Firebase cleanup | PASS: accounts created by completed checks deleted through Firebase API |
| Real Gemini provider probe | PASS: gemini-3.1-flash-lite returned 2 validated captions with hashtags |
| Real Postgres create | BLOCKED: API 502; direct Supabase diagnostic 401 / PGRST301 |
| Firebase database role claim | Missing on observed test token |
| Live CRUD/edit/delete/two-user RLS | NOT VERIFIED because database request is blocked |
| Authenticated app Gemini + quota | NOT VERIFIED because Supabase auth/quota setup is blocked |
| Production dependency audit | PASS: npm audit --omit=dev reports 0 findings |
| Secrets exclusion | .env.local remains ignored; no real env values printed or intentionally committed |

The real Gemini probe validates the same 2-3 captions/hashtag output shape and
SDK structured JSON capability. It does not prove the app's authenticated quota
RPC works. Initial configured model and gemini-2.5-flash returned 404; a minimal
gemini-3.5-flash probe timed out. A listed model, gemini-3.1-flash-lite, passed.
Only the nonsecret GEMINI_MODEL setting in .env.local was updated to this model;
credential values were not changed. Set it separately in Vercel.

## Implemented and inspected

- Firebase REST login/register/logout/refresh, server-side RS256 verification of
  signature, audience, issuer, exp/iat/auth_time and UID. Rotating Google JWKS are
  fetched/cached by JOSE. Cookie data is never trusted without verification.
- HttpOnly/SameSite=Lax cookies; Secure in production. Workspace layout protects
  all workspace pages. Every protected API calls requireUser independently.
- Optional server-only admin REST provisioning merges role=authenticated after
  Firebase identity verification, then refreshes the token. Only a verified UID is
  used. This optional admin path is UNTESTED until service-account credentials
  are supplied. No extra Firebase Admin framework was installed.
- Ordinary Supabase queries use publishable key + verified Firebase JWT. No
  service-role bypass for CRUD. Existing post APIs enforce user filters, strict
  payload validation, attachment ownership, future schedules and edit versions.
- Migrations 001/002 plus new 003 define actual database schema, Firebase text
  ownership, owner RLS, private Storage paths and per-user generation quotas.
  No SQL was executed remotely by this agent. No local PostgreSQL CLI was found.
- Responsive dashboard retained, with editable caption, draft preview, local
  datetime input converted to UTC and stored IANA timezone, saved-post list,
  editing, deletion confirmation, errors and explicit optional-integration states.
- Gemini uses real Google GenAI SDK, structured JSON, 20-second provider timeout,
  output validation, quota checks and useful 404/429/error responses; no mocks.
- Drive/upload/email contracts remain intact. Their routes are honest 501 stubs,
  and UI controls remain unavailable. Preferences CRUD and atomic dispatch SQL
  exist; no scheduled worker, upload or Drive synchronization is implemented.

## Deployment readiness and latest user handoff

The user reports Firebase Third-party Auth is enabled in Supabase and SQL
migrations are being applied. At the user's explicit request, NO further
schema changes or database CRUD retries are performed until migration completion
is confirmed. The PGRST301/missing-role observation above predates that update.
New database diagnostics now map token/schema setup errors to actionable 503
messages; that change was compiled, not re-tested against the database while paused.

Vercel CLI 59.11.2 is installed but `vercel whoami` reports logged out. No Git
remote is configured. Public deployment/push therefore remain pending account
login/repository setup; no temporary anonymous deployment was created. See
DEPLOYMENT_SUBMISSION.md for exact settings, variables and source export.
Node 24.x is pinned to match the tested runtime. .vercelignore excludes secrets.
Configured secret values were compared with tracked/candidate files: none found.
Final production HTTP smoke passed again after the final build. Source/docs text
passed UTF-8 validation; git diff --check passed. Production server is available
at http://localhost:3000 at handoff unless stopped manually.

## Exact remaining manual steps

1. User reports Supabase Third-party Firebase integration is enabled. Confirm
   it matches FIREBASE_PROJECT_ID. PGRST301 means the observed JWT was not accepted;
   verify this integration and matching project before retrying.
2. SQL Editor: apply only unapplied migrations, in order: 001_initial.sql,
   002_generation_quota.sql, 003_firebase_identity.sql. Never rerun 001 over existing
   tables or disable RLS. 003 converts existing ownership to text but does not map
   old Supabase accounts to Firebase accounts.
3. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY from a service account with
   Firebase Authentication Admin on this project, server-only, OR deploy a trusted
   Auth trigger setting the authenticated role. Detailed steps/format are in
   MANUAL_SETUP.md. New users need provisioning, not just a single demo account.
4. Restart/rebuild, then run scripts/check-live-mvp.mjs with --env-file=.env.local.
   It exercises actual registration/login/refresh, persistence/reload/edit/delete,
   optimistic conflict, two-user API isolation, direct RLS denial and app Gemini.
   It creates disposable resources and attempts cleanup; inspect cleanup warnings.
5. In a real browser test registration/login/logout, select generated caption,
   edit, preview, save/reload, schedule, edit/delete, invalid and expired sessions,
   mobile-width layout and error messages. Browser interactions/screenshots were
   NOT tested in this pass; no screenshots are fabricated.
6. Finish mandatory real upload, Drive OAuth/sync and secure email worker. Keep
   ENABLE_EMAIL_DISPATCH=false until verified. Test actual files, Drive artifacts,
   token refresh, partial failure, repeated/concurrent dispatch and received email.
7. Deploy GitHub/Vercel with server env values, exact HTTPS NEXT_PUBLIC_APP_URL
   and Google callback. Re-test deployed behavior; capture genuine screenshots.
   Submit GitHub URL, Vercel URL and unzipped source folder to organizer Drive,
   excluding secrets, .git, node_modules, .next and local evidence.

## Security limits and fallback

JWT signature/expiry verification does not check account revocation on every
request. Previously issued tokens may remain valid until expiry (normally one
hour); refresh is provider-validated. Logout clears this browser, not every device.
Email verification/reset/MFA and Firebase-account deletion cleanup in Postgres
are outside this MVP. Admin provisioning needs cloud IAM verification before use.

Full install audit still reported 14 high development-tooling findings (previously
traced to picomatch/ESLint); production audit after JOSE is clean. No forced audit
fix or framework upgrade was applied. Unit tests use generated local signing keys;
they are not a substitute for live RLS or token-provisioning tests.

If cloud setup cannot be completed before the deadline, report auth/provider
checks as verified and database/optional requirements as incomplete. Keep RLS and
fail-closed errors; do not substitute localStorage or fake service responses.
Restore app source to the original checkpoint only in a separate checkout if
needed; do not discard local credentials or attempt to reverse remote migrations
with Git. Supabase Auth remains an option only after explicit organizer approval
and a separately reviewed implementation/migration change.

## Reproduce

```powershell
Set-Location 'C:\Users\Dawood Ahmad\Desktop\VSpark-Competition-2026\vspark-social-ai'
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
# Another PowerShell window in this folder:
node scripts/smoke.mjs
node --env-file=.env.local scripts/check-gemini.mjs
node --env-file=.env.local scripts/check-live-mvp.mjs
```

The live test deliberately stops at the first integration blocker. A passing
build or configured environment label is not proof of remote integration success.
