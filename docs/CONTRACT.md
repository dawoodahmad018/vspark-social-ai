# Shared contract v1 — frozen contributor boundary

This is a real web application using Next.js App Router. The parent Expo starter
is out of scope. All contributors read this file and `AGENT_OWNERSHIP.md` before
editing. Ask the lead to change shared types/schema; do not fork the contract.

## Identity and transport

Firebase Email/Password authentication is mandatory unless organizer approval changes.
POST /api/auth/register and /api/auth/login accept {email,password}; logout and
refresh use POST /api/auth/logout and /api/auth/refresh. Responses never expose tokens.
HttpOnly, SameSite=Lax cookies hold the ID/refresh tokens (Secure in production).
Every workspace page/API verifies RS256 signatures, issuer, audience and expiry
against Firebase public keys. Expired sessions refresh through Firebase, not a
client-supplied identity. Logout clears this browser session; it is not global
revocation. Existing ID tokens remain valid until expiry after server-side revocation.
Supabase validates the same Firebase JWT via its configured third-party integration.
Tokens MUST have trusted custom claim role=authenticated; do not grant anon CRUD.
Ordinary CRUD uses the publishable key plus Firebase JWT, never service-role bypass.
Browser requests are same-origin with cookies. Mutations reject foreign Origin.
SQL RLS is mandatory in addition to route checks. Never use a service key in UI.

All JSON endpoints return `ApiResult<T>` from `src/lib/contracts.ts`:
`{ok:true,data:T}` or `{ok:false,error:{code,message,retryable}}`.
Codes: UNAUTHENTICATED 401, FORBIDDEN 403, INVALID_INPUT 400, NOT_FOUND 404,
CONFLICT 409, RATE_LIMITED 429, NOT_CONFIGURED 503, NOT_IMPLEMENTED 501,
UPSTREAM_ERROR 502, INTERNAL_ERROR 500. Do not expose tokens/provider stack traces.
Dates are ISO-8601 UTC strings; `timezone` is a valid IANA zone for display.
`scheduled_at=null` means no scheduled time. A scheduled post needs a future time.

## Canonical models

`Post`: id UUID, user_id text (Firebase UID), prompt, caption, platform (instagram/linkedin/x),
scheduled_at nullable, timezone, status (draft/scheduled/archived), drive_file_id
nullable, attachment_path nullable, created_at, updated_at. The application sends
email reminders; it does not publish posts to social platforms. Do not label
emailed or Drive-synced posts as published.

`CaptionCandidate`: id, caption (without hashtags), hashtags (array, each with #).
`GenerationInput`: topic (3–1000 chars), platform, tone (professional/friendly/bold).
Generation requires migrations 002 and 003 and is capped at 3/minute and 40/day per user.
`PostInput`: prompt, caption (1–5000), platform, scheduled_at, timezone, status,
attachment_path. Ownership and Drive file IDs are never accepted from the browser.
`UpdatePostInput`: full PostInput plus expected_updated_at for optimistic locking.
`NotificationPreferences`: enabled, recipient_email, lead_minutes (0–1440),
include_caption; user_id/updated_at are server-managed.

## API routes

| Endpoint | Request / response data | Owner |
| --- | --- | --- |
| GET /api/health | Public redacted configuration/implementation status; no secrets or user data | Lead |
| POST /api/captions | GenerationInput -> `{captions:CaptionCandidate[]}` (2–3), real Gemini only | B |
| GET /api/posts | -> `{posts:Post[]}` for current user, newest first | C |
| POST /api/posts | PostInput -> `{post:Post}`, 201 | C |
| PATCH /api/posts/[id] | UpdatePostInput -> `{post:Post}`; stale timestamp -> 409 | C |
| DELETE /api/posts/[id] | -> `{deleted:true}`; ownership required | C |
| POST /api/uploads | multipart `file`; private user path -> `{path:string}` | A |
| GET /api/integrations/drive/connect | Authenticated browser redirect to Google consent | D |
| GET /api/integrations/drive/callback | Validate state, exchange code; redirect to /integrations | D |
| DELETE /api/integrations/drive | Revoke/remove stored grant -> `{disconnected:true}` | D |
| POST /api/posts/[id]/drive | Existing owned post -> `{file_id:string,web_view_link:string}` | D |
| GET/PATCH /api/preferences | -> `{preferences:NotificationPreferences}` | E |
| GET /api/cron/notifications | Bearer CRON_SECRET, no cookie auth -> batch summary | E |

The lead scaffold supplies real auth/CRUD/generation entry points where feasible.
Reserved integrations return a truthful 501/503. A configured environment variable
does not mean a feature is implemented or tested. UI must distinguish these states.

## Storage and OAuth boundaries

Bucket `post-assets` is private, max 5 MB, JPEG/PNG/WebP/PDF only. Object keys begin
`{Firebase UID}/...`; enforce this in Storage RLS. Route validates size and actual
file signature, uses generated names, and does not trust browser MIME/filename.
Use short-lived signed URLs for previews. No public bucket or arbitrary path reads.

Drive scope is exactly `https://www.googleapis.com/auth/drive.file` plus only
identity scopes if justified. Separate Drive authorization from app login.
OAuth state must be random, expiring and bound to the authenticated user via an
HttpOnly SameSite cookie; reject wrong state/user. Exact redirect URI, offline
access, encrypted refresh-token storage, token refresh/revocation are required.
Use AES-256-GCM with random nonce and server TOKEN_ENCRYPTION_KEY. Store tokens in
`private.google_connections`, never readable by authenticated/anonymous roles.

Database save and Drive sync are separate operations: a failed Drive call must
not discard the saved post. Update an existing drive_file_id on retries; prevent
concurrent creates with a per-post lease. Reflect partial failures and allow retry.
Deletion first removes the DB row; Drive-file removal is a separate explicit action
or a documented retained export. Do not claim that deletion removes a Drive file.

## Notification worker rules

Preferences are explicit and configurable. Worker derives eligible jobs from owned
scheduled posts + enabled preferences; task details include caption/platform/time/
timezone and app link. Snapshot recipient/details into dispatch records. No emails
are sent on page load. Disable dispatch until provider, sender and scheduler work.

Deduplication key: unique `(post_id, scheduled_for, recipient_email)`; the same
key must be used as the email provider idempotency key. Claim due jobs atomically
using the provided service-role-only SQL RPC with SKIP LOCKED and a bounded lease.
Only the worker that owns the lease may complete/fail a dispatch. Recheck current
post/preference eligibility after claiming; cancel stale/deleted/disabled jobs.
Retry transient failures with bounded exponential backoff and at most 5 attempts.
Use provider idempotency within its documented retention window; do not promise
exactly-once email across provider timeouts. Expired uncertain sends require
reconciliation, not blind duplicate sends. Track accepted vs delivered separately.

## Acceptance gates

No fake captions, localStorage DB fallback, invented Drive links or email success.
No public secrets. Test two-user isolation, logged-out API denial, invalid input,
expired OAuth token, Drive partial failure, repeated worker invocation and canceled
schedule. All contributors run typecheck/lint; lead runs build after integration.
