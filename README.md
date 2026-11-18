# V-Spark Social AI

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
  table. No cloud migration or external integration has been run automatically.

Real Firebase registration/login/refresh and a direct Gemini caption request were
verified locally. Authenticated database CRUD remains blocked by cloud setup;
see docs/VERIFICATION.md for exact results. Uploads, Drive and email remain incomplete.

## Explicitly incomplete integrations

Google Drive OAuth/sync, the file-upload handler and the email dispatch worker
are reserved route skeletons returning NOT_IMPLEMENTED. Their controls remain
unavailable even if environment keys are present. No cron schedule is activated.
The application does not publish content to social platforms; it stores schedules
and is intended to send email reminders after the worker is implemented.

Firebase is the active identity provider. Supabase must be configured to accept
that Firebase project, and tokens must include role=authenticated. Follow the
exact setup in docs/MANUAL_SETUP.md. Ordinary CRUD uses RLS, not service-role bypass.

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
updates RLS/quotas. Apply each file once in order. Keep RLS enabled. Test two-user isolation before submission.

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

No GitHub remote, Vercel public URL or organizer Drive upload has been created
in this setup pass. Those require your accounts and the organizer destination.

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
