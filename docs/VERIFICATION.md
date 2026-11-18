# Setup verification — 18 November 2026

## Scope completed

New standalone Next.js app at `vspark-social-ai`, with its own local Git repository.
The parent Expo source/configuration/lockfile were not modified. This is the
first-task foundation and contributor handoff, not a claim that every official
competition feature is complete.

## Verified results

| Check | Observed result |
| --- | --- |
| npm installation | Completed, 408 packages added; lockfile created |
| Manifest/lockfile comparison | Dependency and devDependency maps match |
| `npm.cmd run typecheck` | PASS; Next route types generated and tsc completed |
| `npm.cmd run lint` | PASS, no findings |
| `npm.cmd test` | PASS, 4 tests / 0 failures |
| `npm.cmd run build` | PASS, Next 16.4.6 / Turbopack production build, including rebuild with .env.local present |
| Production server | Started successfully at http://127.0.0.1:3000 |
| Initial no-config HTTP checks | Dashboard/posts/integrations/settings/login/register each 200; protected APIs 503 NOT_CONFIGURED |
| Configured signed-out page checks | Dashboard/posts/integrations/settings each 307 redirect to /login |
| Login/register HTTP | Each 200 with HTML |
| Configured signed-out API checks | Posts/preferences/Drive connect/Gemini each 401 |
| Foreign-Origin mutation | 403 |
| Cron without configured scheduler | 503; no dispatch performed |
| Root Expo tracked-file diff | Empty; parent files preserved |
| Secrets exclusion | .env.local and .verification are ignored; only .env.example is intended for source control |

HTTP checks are reproducible with `node scripts/smoke.mjs` while the production
server is running. They inspect route delivery and server-side access controls,
not browser click/keyboard behavior or external service success.

Installed direct runtime versions: Next 16.4.6, React/React DOM 19.3.0,
@google/genai 3.6.0, @supabase/ssr 0.12.7, @supabase/supabase-js 2.119.0,
zod 4.6.7, server-only 0.0.1. Tailwind and its Turbopack loader are 4.3.3.
Node is v24.13.1. Use npm.cmd/npx.cmd in this Windows PowerShell environment.

## Tests and architecture inspected

The four tests cover generation input, rejected unknown/ownership fields, platform,
IANA timezone, future scheduling, required optimistic-update timestamp, recipient
email and bounded reminder lead time. They do not execute SQL or cloud services.

Server routes call verified Supabase auth.getUser before CRUD/generation. Post
queries include user_id filters, and SQL adds owner RLS plus restricted column
writes. Client-supplied owner IDs and Drive IDs are rejected by strict schemas.
Same-origin mutation checks and JSON limits are present. Gemini uses the actual
Google GenAI SDK with structured-output validation and no fake fallback. The
quota RPC must be applied before a generation call can proceed.

The private upload bucket, encrypted-token table and notification dispatch/claim
SQL are definitions only; no migration was run against a remote database here.
Lease-token completion and SKIP LOCKED claim SQL require execution and concurrency
tests before the email worker is activated. Expired sends become uncertain rather
than being blindly retried. The actual worker is not yet implemented.

## Dependency audit

Full audit: **14 high, 0 moderate, 0 critical**. All affected lockfile paths are
marked dev=true and trace to the picomatch advisory
[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), propagated
through ESLint/TypeScript/glob tooling. Production-only audit (`npm audit
--omit=dev --json`): **0 findings** at review time. This does not certify the app
as vulnerability-free. No forced fix/downgrade was applied. Retain the lockfile
and use trusted tooling inputs. Evidence is local under `.verification/`.

`npm ls --depth=0` also listed @emnapi/runtime and @img/sharp-wasm32 as extraneous
optional/native-install artifacts. The production build passed; no pruning was
performed to avoid disturbing a working native compiler installation.

## Untested / incomplete

- Live registration, confirmation email, login, logout, token refresh and two-user
  isolation. Signed-out route denial was tested, not a successful authenticated flow.
- SQL migration execution, actual Postgres persistence/CRUD, optimistic conflict
  under concurrency, RLS denial tests and private Storage permissions.
- Actual Gemini response/quota/429/timeout behavior; server-side entry point exists.
- **Upload handler:** 501 skeleton; no real upload performed.
- **Drive:** OAuth/connect/callback/sync/disconnect are 501 skeletons. Token
  encryption/refresh/revocation and serialized sync still belong to contributor D.
- **Email:** preferences API/UI and dispatch SQL exist; the cron route only
  authenticates/rejects and returns 501 when a secret is valid. No provider request,
  scheduler registration, accepted email or received email was tested. Dispatch
  remains disabled. Contributor E must implement it and verify deduplication.
- Browser visual inspection, responsive behavior, interactive form flows and
  genuine screenshots. Browser/native automation host returned unavailable.
- GitHub remote/push, public Vercel deployment and organizer Google Drive upload.
  No public URL is claimed.

A .env.local file was added locally during setup. Values were not printed or
committed. A successful build with the file present proves compilation only,
not that any credential is valid or that its associated cloud resource exists.

## Next manual steps / contributor handoff

1. Confirm organizer approval of Supabase Auth as the Firebase alternative and
   clarify whether the deadline is 60 or 120 minutes.
2. Follow MANUAL_SETUP.md: Supabase project, SQL migrations 001 then 002, redirects,
   email confirmation and two accounts. A finishes real private uploads.
3. Register/sign in manually; B verifies a real Gemini generation using the
   configured model/key; C tests save -> reload -> edit -> delete in the real DB.
4. D finishes Google OAuth with exact local/production redirects and drive.file;
   verify real export, re-sync, revoked token and partial failure after DB save.
5. E finishes authenticated scheduled dispatch with real verified sender/provider,
   preferences, atomic leases/idempotency and observed received email. Check the
   scheduler plan supports the required frequency before enabling it.
6. Lead composes completed owned modules, repeats checks, deploys Vercel, updates
   OAuth/auth URLs, captures genuine screenshots and submits all three required links.

The server used for checks is stopped at handoff. Start development with
`npm.cmd run dev` from this app folder. No real credentials belong in GitHub or
in the unzipped organizer submission; retain the blank .env.example template.
