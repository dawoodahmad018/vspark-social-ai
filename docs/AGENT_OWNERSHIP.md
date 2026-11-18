# Five Claude contributor ownership map

One contributor per row. These are module assignments, not five active coding
machines. The local coordinator integrates sequentially on the single laptop.
Do not edit another owner's files; message the lead with a proposed change.

| Contributor | Exclusive write ownership | Deliverable / handoff |
| --- | --- | --- |
| A — Auth + uploads | `src/lib/supabase/**`, `src/lib/auth/**`, `src/app/auth/**`, `src/components/auth/**`, `src/app/api/uploads/**` | Real registration/login/logout, session refresh, server verification and private signature-validated uploads. Export existing helper signatures unchanged. |
| B — Gemini | `src/app/api/captions/**`, `src/lib/generation/**`, `src/components/generation/**` | Real 2–3 captions with hashtags, validated structured output, authenticated quota/rate protection, timeout/429/error UI. No mock fallbacks. |
| C — Posts + scheduling | `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`, `src/lib/posts/**`, `src/components/posts/**` | User-owned CRUD, optimistic edit conflict, timezone-safe scheduling and drafts/calendar list. Do NOT touch nested `[id]/drive` route. |
| D — Google Drive | `src/app/api/integrations/drive/**`, `src/app/api/posts/[id]/drive/**`, `src/lib/drive/**`, `src/components/drive/**` | drive.file OAuth with state, encryption/refresh/revocation, real export/update, lease and partial-failure/retry behavior. |
| E — Email notifications | `src/app/api/preferences/**`, `src/app/api/cron/**`, `src/lib/notifications/**`, `src/components/notifications/**` | Preference CRUD, service-authenticated worker, atomic claims, provider idempotency, retries and task-details email. |

## Lead-only shared files

`package*.json`, all root configuration, `src/app/layout.tsx`,
`src/app/globals.css`, `src/app/page.tsx`, `src/app/(workspace)/**`,
`src/components/shell/**`, `src/components/dashboard.tsx`, `src/lib/contracts.ts`,
`src/lib/validation.ts`, `src/lib/http.ts`, `src/lib/client.ts`, `src/lib/config.ts`, `src/proxy.ts`,
`src/app/api/health/**`, `supabase/**`, `.env.example`, `docs/**`, README and tests.
Only the lead composes feature components into pages and applies migrations.

Contributors propose schema changes as text to the lead; do not create competing
migrations. Lead preserves RLS and applies a reviewed migration once. Dependency
requests list package, purpose and weight; lead alone installs. Never touch the
parent Expo project, real .env, GitHub/Vercel credentials or another owner's work.

## Integration sequence (first-hour target)

0–10m: lead freezes contract, schema and shell; A connects Supabase; B connects Gemini.
10–30m: C completes saved-post CRUD; D starts OAuth; E preferences and claims.
30–45m: lead composes flows; complete real upload + Drive happy path, then email.
45–60m: end-to-end, RLS denial cases, build, Vercel deployment and submission.
If 120 minutes is confirmed, use the extra time for retries, negative cases,
screenshots and presentation. Mandatory features remain incomplete until tested.

Each handoff reports changed paths, exported signatures, actual checks, pending
credentials and failures. A 501 route is an explicit remaining task, not completion.

## UI handoff signatures (lead composes these)

A retains `AuthForm({mode:'login'|'register',configured:boolean})`,
`browserSupabase()`, `serverSupabase()` and `requireUser()` signatures.
B may extract `CaptionGenerator({enabled,onSelect})`; onSelect receives
`(candidate:CaptionCandidate,prompt:string,platform:Platform)`.
C may extract `PostLibrary({onEdit,refreshKey})`, where onEdit receives a Post,
and `ScheduleEditor({post,onSaved,onCancel})` with Post|null and void callbacks.
D exports `DriveConnection({configured})` and `DriveSyncButton({postId,onSynced})`.
E retains `PreferencesForm({configured:boolean})` and owns its worker route.
These proposed components must be handed to the lead for composition; do not
edit the existing lead-owned Dashboard component during extraction.
