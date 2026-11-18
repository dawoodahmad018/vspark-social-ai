# Credential and deployment handoff

Do not paste secrets into chat, commit them, or upload .env files to organizers.
Copy `.env.example` to `.env.local` locally and fill it in your editor. Vercel gets
its own encrypted environment variables. This scaffold contains no real credentials.

## 1. Firebase identity + Supabase database (required now)

Supabase Auth approval was not confirmed. Firebase Email/Password is implemented;
Supabase is used for Postgres/Storage with its supported Firebase JWT integration.
Existing Supabase/Gemini/Google variable names are preserved. Added Firebase
variables are server-only. Do not put a service-account JSON inside this project.

1. Firebase Console -> create/select the project -> Authentication -> Sign-in
   method -> enable Email/Password. Project settings -> General -> register a Web
   app if needed. Copy its apiKey into FIREBASE_API_KEY and projectId into
   FIREBASE_PROJECT_ID in .env.local. Do not paste values into chat.
2. Supabase -> Authentication -> Third-party Auth -> Add integration -> Firebase.
   Enter the SAME Firebase project ID. This permits Supabase to validate Firebase
   JWTs. Keep the existing URL/publishable-key env names. Do not disable RLS.
3. In the intended competition Supabase project's SQL Editor apply each migration
   ONCE, in order: 001_initial.sql, 002_generation_quota.sql,
   003_firebase_identity.sql. If 001/002 were already applied, run only 003.
   If unsure, inspect tables/migration history before running. 003 is transactional,
   converts UUID ownership to Firebase string UIDs and replaces owner/storage RLS.
   Existing Supabase Auth users are NOT automatically mapped to Firebase users.
4. New Firebase tokens require trusted custom claim role=authenticated. Fast path:
   Firebase Project Settings -> Service accounts -> generate a private key for a
   service account with Firebase Authentication Admin on this SAME project.
   Keep the downloaded JSON outside the repository/submission. Copy only its
   client_email into FIREBASE_CLIENT_EMAIL and private_key into
   FIREBASE_PRIVATE_KEY, server-side. Example format (not a real key):
   `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
   Keep quotes in .env.local; Vercel's variable editor receives the key value,
   not surrounding dotenv quotes. Both escaped and actual newlines are handled.
   Restart the server. Registration/login verifies the Firebase identity, merges
   the role claim through Google's admin REST API, then refreshes the token.
   No service-role Supabase key is used for ordinary CRUD.
5. Alternative without a runtime admin key: deploy a trusted Firebase Auth
   onCreate trigger using Admin SDK setCustomUserClaims(uid, {role:'authenticated'}),
   preserving any existing claims. Also provision existing users. Log out/in after
   the trigger has run. The trigger itself is NOT deployed by this repository.
   Do not grant anon table access to skip this step. Every newly registered user
   needs the claim; manually provisioning only demo users is not a full solution.
6. Run the production build/start commands below, then the disposable live check:
   `node --env-file=.env.local scripts/check-live-mvp.mjs`
   It creates/deletes Firebase test users and posts, verifies login/refresh/CRUD,
   stale edits, two-user ownership, direct RLS denial and authenticated Gemini.
   It stops at the first blocker. Inspect any MANUAL CLEANUP message; remove
   leftover vspark-check-* accounts in Firebase Console. Firebase account deletion
   does not cascade into Postgres; production user deletion requires a reviewed
   cleanup workflow. No account-delete feature is claimed here.
7. Confirm private bucket post-assets, 5 MB limit, MIME restrictions and Firebase
   UID object-prefix RLS. Upload handler remains an explicit 501 until implemented.

Local sessions use HttpOnly/SameSite cookies; production sets Secure. Use
http://localhost:3000 locally and HTTPS on Vercel. Logout clears the current
browser cookies, not all devices. JWT verification checks signature/issuer/audience/
expiry, but does not query token revocation on every request: an already issued
ID token can remain valid for up to its expiry (normally one hour). Refresh is
provider-validated. Firebase email verification, reset-password and MFA flows are
not implemented; enable stronger account policies if required after the MVP.

## 2. Gemini (B)

1. Create an API key at Google AI Studio; enable the required project/billing or
   quota as applicable. Set GEMINI_API_KEY on the server.
2. Set GEMINI_MODEL to a model currently enabled in your account. Do not assume
   a particular free model or quota; verify with a small real request.
3. Test 2–3 captions, hashtags, malformed/blocked response, 429 quota and timeout.
   A successful Next build is not evidence that Gemini works.

## 3. Google Drive OAuth (D)

1. Google Cloud: enable Drive API, configure consent screen and add competition
   testers while the OAuth app is in testing mode.
2. Create a **Web application** OAuth client. Set GOOGLE_CLIENT_ID and
   GOOGLE_CLIENT_SECRET only on the server. Authorized redirect URI must exactly
   match GOOGLE_REDIRECT_URI, e.g. local `/api/integrations/drive/callback` and
   the corresponding HTTPS Vercel URL. Add both explicitly in Google Cloud.
3. Generate TOKEN_ENCRYPTION_KEY locally (32 random bytes, hex). Set it on the
   server; never commit/output the generated secret. Keep it stable while tokens
   encrypted with it exist. D adds service-only token RPCs to a lead-reviewed migration.
4. Implement OAuth state binding, drive.file scope, offline refresh, encrypted
   token storage, disconnect and serialized sync before enabling UI controls.
5. Test real consent → save DB post → sync → inspect Drive file → edit/re-sync
   same file. Test revoked grant, token refresh, denied consent and failed Drive
   after successful DB save. Do not lose saved posts on sync failure.

## 4. Email and scheduled worker (E)

1. Choose Resend (proposed) or an approved provider supporting idempotency.
   Create its key and verify sender domain/address. Set RESEND_API_KEY and
   EMAIL_FROM server-side; test provider limits and allowed recipients.
2. Generate a strong CRON_SECRET locally; the cron endpoint requires exact Bearer
   authorization. Implement E's worker and recheck lease/deduplication rules in
   CONTRACT.md. The scaffold does not send email or register a live cron schedule.
3. Select an actual scheduler whose plan supports the required interval. Check
   current Vercel plan limits; do not assume Hobby supports minute-by-minute cron.
   Use an approved secure scheduler if necessary. Configure request authentication.
4. Only after implementation/testing set ENABLE_EMAIL_DISPATCH=true. Test a near
   future scheduled task, recipient/preferences, repeat invocation, concurrent
   invocation, canceled task, transient failure and uncertain provider timeout.
   Provider acceptance is not proof of inbox delivery; inspect the received email.

## 5. GitHub, Vercel and organizer submission (lead)

1. Create a new GitHub repo containing **only `vspark-social-ai` contents**. The
   existing parent Git repo is the Expo starter; do not push it as this web app.
   Review `git status`, `.gitignore` and `git ls-files` for secrets before pushing.
2. Import this new repo into Vercel as Next.js. If using the parent repo instead,
   explicitly select Root Directory `vspark-social-ai` and keep the Expo files out
   of the submitted project folder. Framework preset: Next.js; build: npm run build.
3. Set all required environment variables in Vercel for the intended environment;
   NEXT_PUBLIC_APP_URL must match the exact HTTPS deployment origin. Redeploy
   after changing build-time NEXT_PUBLIC values. No service keys are public.
4. Update Google OAuth callback to the final URL. Public
   hosting alone does not imply the dashboard's protected content is public.
5. Test incognito registration/login, real generation, two-user DB isolation, real
   upload, Drive sync, edit/delete and scheduled email on the deployed app.
6. Capture actual dashboard, generated captions, saved schedule and settings
   screenshots in `docs/screenshots/`; add them to README with descriptive captions.
   Do not create screenshots that imply untested integrations work.
7. Upload the **unzipped complete source folder** to the organizers' specified
   Google Drive destination. Exclude .env*, node_modules, .next, .git, .vercel and
   local verification evidence, retaining .env.example and package-lock.json.
   Include migrations/docs. Confirm whether organizers require dependencies;
   provide `npm.cmd ci` instructions and never include secrets either way.
8. Submit GitHub URL + live Vercel URL + organizer Drive folder link before deadline.
   No repository, cloud resources, upload or public deployment is claimed until observed.

## Reproducible local checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
# In another PowerShell window in this same folder:
node scripts/smoke.mjs
node --env-file=.env.local scripts/check-gemini.mjs
node --env-file=.env.local scripts/check-live-mvp.mjs
```

The direct Gemini probe verified gemini-3.1-flash-lite in this account on
18 November 2026. The local nonsecret GEMINI_MODEL was updated to that model.
Set the same value in Vercel, or verify a different model before switching.
An initial configured model and a gemini-2.5-flash probe returned 404; a separate
minimal gemini-3.5-flash request timed out. No fallback responses were fabricated.

References: [Firebase REST](https://firebase.google.com/docs/reference/rest/auth),
[Firebase JWT verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens),
[Supabase Firebase integration and role claim](https://supabase.com/docs/guides/auth/third-party/firebase-auth),
[Google admin account update](https://cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/update).
