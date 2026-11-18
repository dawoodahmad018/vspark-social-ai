# Final competition verification - 18 November 2026

## Verified locally AND on the public production deployment

- Firebase registration/login/token refresh and server-side identity verification.
- Firebase Admin service-account role provisioning: a newly registered user can
  access authenticated Supabase data without service-role CRUD bypass.
- Postgres create/list/reload/edit/delete, future scheduling and stale-write 409.
- Two-user API isolation; direct Supabase RLS hides another user's post and rejects
  spoofed ownership inserts. All disposable test posts/accounts were deleted.
- Authenticated Gemini generation with database quota returned 2-3 captions and
  hashtags using gemini-3.1-flash-lite. No mock fallback.
- Real private PNG upload; another user cannot retrieve it; unsafe SVG rejected.
  Owner retrieval also passed on production. Test file was removed.
- Drive private token RPC and OAuth redirect preflight passed. Consent URL uses
  drive.file + PKCE S256; state is encrypted, expires and is bound to the user.
  This confirms the required migration-004 RPC exists on the connected database.
- Signed-out HTTP checks: workspace redirects, protected API 401, forged cookie
  rejection, foreign-Origin 403, logout cookie clearing and cron denial all pass.
- TypeScript PASS, lint PASS, 9 tests PASS, production Next build PASS.
- Tests cover strict inputs/schedules, JWT verification, authenticated encryption
  and file signature/MIME/size validation. Tests are not cloud-service substitutes.
- Production dependency audit previously returned 0 findings. Full install audit
  retains 14 development-tooling findings; no forced fixes were used.

## Implemented but requiring manual live confirmation

Drive connect/callback/refresh/revoke and text-file create/update are implemented.
Tokens use AES-256-GCM and private, service-only storage. A Google-generated ID
is atomically reserved on the owned post, so retries use the same ID. A reserved
ID is NOT proof of a saved file. Actual Google consent, file sync/retrieval,
refresh/revocation and failure/concurrency cases are not yet verified. Concurrent
content updates may be last-write-wins; re-sync after edits. Existing database
posts survive Drive errors. Deleting a post retains any exported Drive file.

Uploads support signature/MIME-matched PNG/JPEG/WebP/PDF, application limit 4 MB;
bucket limit remains 5 MB. MIME signatures do not constitute malware scanning.
Uploaded-but-detached files can remain in private storage; no garbage collector
or Firebase-account-to-Postgres deletion workflow is implemented.

Email preferences/atomic dispatch SQL exist; the email worker remains 501.
ENABLE_EMAIL_DISPATCH stays false. No email or automatic notification is claimed.
JWT verification does not check revocation on every request; issued ID tokens can
remain valid until expiry. Email verification/reset/MFA flows are not implemented.

## Deployment / submission

- GitHub owner confirmed: dawoodahmad018.
- Repository created/access verified: https://github.com/dawoodahmad018/vspark-social-ai
- Vercel login verified; project linked under the logged-in account.
- Production domain assigned/verified: https://vspark-social-ai.vercel.app
- Required production values securely set via stdin. No secret values logged.
- Production NEXT_PUBLIC_APP_URL is the exact HTTPS origin. Google redirect is
  https://vspark-social-ai.vercel.app/api/integrations/drive/callback.
- Production deployment READY, built successfully on Vercel and aliased to
  https://vspark-social-ai.vercel.app. GitHub push to main succeeded.
- Public HTTP smoke PASSED without a bypass token: login/register 200, workspace
  307 redirects, API 401, foreign-Origin 403, forged-session denial and logout.
- Full production live script PASSED: new-user admin role provisioning, auth,
  CRUD/reload/schedule/conflict, direct two-user RLS, private PNG upload/owner
  retrieval/cross-user denial, invalid-file rejection, authenticated Gemini and
  Drive consent redirect preflight. Disposable posts/files/accounts were deleted.
- Production cron returns 503 because no worker/cron secret is enabled; no email
  is sent. No automatic scheduler is configured.
- Screenshot automation attempted via the computer-use skill, but the native
  pipe was unavailable. Genuine browser screenshots remain a manual requirement.
- .env.local/.verification/.vercel stay ignored; .vercelignore excludes secrets.
  Source submission contains only committed source, template, docs and lockfile.

Manual final steps: add the exact production callback to the Google Cloud Web
OAuth client, enable Drive API/add tester, perform consent + actual Drive sync,
capture real browser screenshots, verify the deployed flow and submit GitHub/live/
organizer Drive links. No organizer upload has been performed by this agent.

## Reproduce

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
# Another terminal in this app folder:
node scripts/smoke.mjs
node --env-file=.env.local scripts/check-live-mvp.mjs
node scripts/prepare-submission.mjs
```

The live script creates disposable accounts/posts/files, verifies ownership and
cleans up. Do not expose test passwords/tokens or commit env files. The parent
Expo starter was not modified. Original checkpoint a8f72bd remains available.
