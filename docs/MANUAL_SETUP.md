# Credential and deployment handoff

Do not paste secrets into chat, commit them, or upload .env files to organizers.
Copy `.env.example` to `.env.local` locally and fill it in your editor. Vercel gets
its own encrypted environment variables. This scaffold contains no real credentials.

## 1. Supabase: database, auth and uploads (A + lead)

1. Create/select a Supabase project. Ask organizers to approve Supabase Auth as
   the Firebase alternative before relying on it for submission.
2. Project Settings → API: set NEXT_PUBLIC_SUPABASE_URL and the publishable key.
   Never use a service-role key in either public variable.
3. Put the service-role key in SUPABASE_SERVICE_ROLE_KEY server-side only; it is
   reserved for reviewed background-worker / encrypted-token RPC operations.
4. Run `supabase/migrations/001_initial.sql` in SQL Editor on the new project.
   Then run later numbered migrations in order. Review before executing; do not
   run against an unrelated existing production project.
5. Auth → URL Configuration: Site URL = local origin during testing, then the
   exact Vercel production origin. Add `/auth/confirm` redirect URLs for local and
   production. Keep email confirmation on; configure your confirmation email
   template to `/auth/confirm?token_hash={{ .TokenHash }}&type=email` on your site.
6. Enable email/password. Register two accounts, confirm emails, test login and
   logout. Check protected page redirect and API 401, then cross-user CRUD denial.
7. Confirm Storage bucket `post-assets` is private and limited to 5 MB and permitted
   types. A must finish signature-validation upload route, then test a real file,
   forbidden type, oversize file and another user's path access.

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
4. Update Supabase redirects and Google OAuth callback to the final URL. Public
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
