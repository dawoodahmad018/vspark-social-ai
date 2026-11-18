# V-Spark Social AI

[GitHub](https://github.com/dawoodahmad018/vspark-social-ai) ? [Production domain](https://vspark-social-ai.vercel.app)

Live-service checks: Firebase auth/admin provisioning, Postgres CRUD/scheduling,
two-user RLS, authenticated Gemini and private upload/retrieval passed locally
AND on the public Vercel deployment.
See docs/VERIFICATION.md for exact limits and deployment verification.

Next.js 16 App Router + React + TypeScript + Tailwind foundation for the official
AI Social Media Content Generator & Scheduler. This app is isolated in
`vspark-social-ai`; the existing Expo project is preserved.

## Run on Windows PowerShell

```powershell
Set-Location 'C:\Users\Dawood Ahmad\Desktop\VSpark-Competition-2026\vspark-social-ai'
# Dependencies are already installed. Use npm.cmd ci only for a deliberate reinstall.
npm.cmd run dev
```

Open http://localhost:3000. The public login/register pages load without credentials. All workspace pages
redirect signed-out users to login; APIs fail closed. Firebase and Supabase setup
is required for an authenticated data flow.
For integration setup, copy the template once, then edit it locally:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Do not paste keys into chat or commit real environment files. Restart the server
when environment values change. NEXT_PUBLIC_ values are public bundle values.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
# In another PowerShell window, with the production server running:
node scripts/smoke.mjs http://localhost:3000
```

## Implemented foundation

- Responsive dashboard, topic/platform/tone panel, caption selection/editor,
  draft/schedule library, edit/delete controls, integration states and settings.
- Firebase Email/Password registration/login/logout through server REST routes,
  HttpOnly session cookies, signature/issuer/audience verification and token refresh.
  Optional server-side admin credentials provision the Supabase role claim.
  All workspace routes redirect signed-out users to login.
- Authenticated Postgres CRUD routes with explicit ownership filters, input
  validation, same-origin mutation checks and optimistic update timestamps.
- Real Google GenAI SDK generation entry point: 2–3 structured caption options,
  hashtags, timeout/error handling and database-backed per-user quotas.
- Notification preference CRUD. Migration defines dispatch tracking, deduplication,
  atomic SKIP LOCKED claims, lease-token completion and uncertain-send handling.
- SQL RLS policies, private upload bucket permissions and private encrypted-token
  table. Live Auth/Postgres/Gemini/Storage checks passed; see verification report.

Real Firebase registration/login/refresh and a direct Gemini caption request were
verified locally. Authenticated database CRUD and private uploads now pass live checks;
see docs/VERIFICATION.md for exact results. Drive consent/sync and email remain unverified.

## Integration readiness

Real Firebase role provisioning, authenticated Postgres CRUD, scheduling, two-user
API/RLS isolation and authenticated Gemini generation passed local live checks.
Real private PNG upload, cross-user Storage denial and invalid-type rejection passed.
The upload handler accepts matching PNG/JPEG/WebP/PDF signatures up to 4 MB.

Google Drive OAuth with PKCE/state, encrypted server token storage, refresh,
disconnect and text-file save/update are implemented. Apply migration 004 once,
then connect from Integrations. Stable Google-generated IDs are atomically
reserved to prevent duplicate files on retries. A reserved ID does not confirm a
successful sync; only a successful Google response does. Real consent and file
creation/update remain unverified until manually performed.

Email preferences/dispatch SQL exist, but the email worker remains a 501 stub.
No automatic notification or inbox delivery is claimed. Keep dispatch disabled.

## Shared contract and five contributor assignments

Read these before any parallel contribution:

- [docs/CONTRACT.md](docs/CONTRACT.md): canonical models, endpoint payloads,
  errors, auth, OAuth and worker guarantees.
- [docs/AGENT_OWNERSHIP.md](docs/AGENT_OWNERSHIP.md): exact non-overlapping paths
  for A Auth/Uploads, B Gemini, C Posts/Scheduling, D Drive, E Notifications.
- [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md): exact Supabase, Google, email,
  GitHub, Vercel and organizer-upload setup steps requiring your own accounts.
- [docs/VERIFICATION.md](docs/VERIFICATION.md): observed checks and remaining gaps.

Lead alone edits shared types, migrations, dependencies and composed pages. Other
contributors deliver owned modules without changing the contract. Five contributor
assignments do not imply five computers or simultaneous local coders.

## Database setup

Run numbered files in `supabase/migrations/` in order in a NEW Supabase project's
SQL Editor. Migration 001 defines posts, preferences, dispatches, private token
storage and private Storage policies. Migration 002 adds generation quotas and
service-role grants. Migration 003 converts ownership to Firebase string UIDs and
updates RLS/quotas. Apply each file once in order. Migration 004 adds private Drive token access RPCs for the server only.
Keep RLS enabled. Two-user CRUD/Storage isolation passed local live checks.

Required post columns: id, user_id, prompt, caption, platform, scheduled_at,
timezone, status, drive_file_id, created_at, updated_at. Optional attachment_path
is included. The browser never sets ownership or Drive IDs. Times are stored in
UTC with IANA timezone metadata; the editor currently uses the browser timezone.

Post save and Drive sync are separate operations. A Drive failure must preserve
the database record and expose a retry. A successful database save is not a Drive
success. Deleting a database post does not automatically remove an exported file.

## First-hour priorities

1. Lead/A: configure Firebase + Supabase third-party Auth, run SQL, verify login + two-user RLS.
2. B: add the real Gemini key/model, verify useful captions and provider errors.
3. C: complete the caption -> save -> edit/delete path and timezone checks.
4. D/A: finish Drive OAuth/sync and real private uploads; test partial failures.
5. E: finish preferences -> authenticated scheduled worker -> actual received email.
6. Lead: Vercel deploy, live end-to-end checks, screenshots and submission.

Resolve the one-hour vs 120-minute conflict with organizers. Work toward a
complete first-hour flow, then use any confirmed additional time for reliability.
Mandatory requirements remain pending until implemented and tested.

## Deployment and submission

Follow [deployment and submission guide](docs/DEPLOYMENT_SUBMISSION.md) for
Vercel settings, environment names, GitHub commands and the clean unzipped export.

This is a Vercel-compatible Node application, not a static export. `vercel.json`
selects Next.js; no external cron is enabled before its worker is ready. Create a
new GitHub repo containing only this app, or explicitly select `vspark-social-ai`
as Vercel Root Directory when importing a parent repo. Populate environment values,
update exact Google redirect URLs, and redeploy after public env changes.
See MANUAL_SETUP.md for the complete ordered checklist.

GitHub main was pushed and the Vercel deployment is live; production smoke and
authenticated CRUD/Storage/Gemini checks passed. Organizer Drive upload remains
manual; use the clean source folder from scripts/prepare-submission.mjs.

## Screenshots

Actual screenshots are still required. Capture dashboard, real generated captions,
a saved scheduled post and notification settings after live testing; place them
in `docs/screenshots/` and add Markdown image links here. No fabricated success
screenshots are included. See [screenshot checklist](docs/screenshots/README.md).

## Security and limitations

Server secrets stay outside NEXT_PUBLIC_. Server-side auth checks plus database
RLS protect user data. Service-role credentials are reserved for reviewed workers
and token RPCs. Private token encryption, OAuth state/refresh/revocation, upload
signature validation and provider-idempotent delivery must be completed by their
owners before enabling those integrations. Never promise exactly-once delivery
across external provider timeouts; retain an uncertain state for reconciliation.

The dependency installer reported 14 high advisories; see the verification report
for the final audit result. No forced dependency changes were made.

Official references: [Next.js](https://nextjs.org/docs/app),
[Supabase Firebase Auth](https://supabase.com/docs/guides/auth/third-party/firebase-auth),
[Google GenAI SDK](https://github.com/googleapis/js-genai),
[Drive OAuth](https://developers.google.com/identity/protocols/oauth2/web-server),
[Vercel cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
