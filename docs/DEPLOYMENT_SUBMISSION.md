# Deployment and final submission

## Vercel settings

- Repository: this app's own Git repository, not the parent Expo starter.
- Framework: Next.js. Root: repository root if pushing this app alone; otherwise
  explicitly choose vspark-social-ai in the parent repository.
- Install: npm ci. Build: npm run build. Output: framework default, not static export.
- Node: 24.x, matching the locally verified runtime. engines.node pins this major.
- Existing vercel.json selects Next.js. No cron schedule is enabled.
- .vercelignore excludes local env files, build/dependency directories and common
  credential files. Do not place service-account downloads in this repository.

## Required production environment

Use Vercel Project Settings -> Environment Variables; enter values privately.

| Variable | Purpose |
| --- | --- |
| NEXT_PUBLIC_APP_URL | Exact HTTPS production origin, no path/trailing slash |
| NEXT_PUBLIC_SUPABASE_URL | Intended Supabase project |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public publishable key, never service-role |
| FIREBASE_API_KEY | Firebase Web API key, server-side in this implementation |
| FIREBASE_PROJECT_ID | Same Firebase project registered with Supabase |
| FIREBASE_CLIENT_EMAIL | Firebase Authentication Admin account, if using automatic claim provisioning |
| FIREBASE_PRIVATE_KEY | PKCS8 key for that account, server-only; value without dotenv surrounding quotes |
| GEMINI_API_KEY | Server-only provider key |
| GEMINI_MODEL | gemini-3.1-flash-lite passed the direct provider probe |
| ENABLE_EMAIL_DISPATCH | false until the real worker is implemented/tested |

Admin credentials may be omitted only when a trusted external trigger provisions
role=authenticated for every user. Optional Drive/email/storage variables retain
their existing names in .env.example; setting them does not implement the stubs.
SUPABASE_SERVICE_ROLE_KEY remains reserved for reviewed workers/token RPCs.
Set environment scopes intentionally. Redeploy after environment changes.

## Fast deployment sequence

1. Verify git status and the current checkpoint. Create an empty GitHub repository
   in your own account; do not initialize a conflicting README remotely.
2. Add its remote and push (replace placeholders, never put a token in the URL):

   ```powershell
   git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
   git push -u origin HEAD
   ```

3. Import the repo in Vercel. Apply the settings/variables above. Use the chosen
   stable production domain as NEXT_PUBLIC_APP_URL. Deploy/redeploy as needed
   after the assigned domain is known. Do not use localhost in production.
4. Alternatively, the already installed CLI can deploy from this folder after
   you log in and link the intended project:

   ```powershell
   vercel.cmd login
   vercel.cmd link
   # Configure the server environment privately in the Vercel dashboard first.
   vercel.cmd --prod
   ```

5. Confirm public access from an incognito browser; login/register must load.
   Workspace pages should redirect before login. Then verify real login, saved
   drafts and Gemini once the database setup is confirmed complete. Do not call
   the signed-out smoke script with active browser cookies.
6. Google Drive callback configuration and email/provider/scheduler setup still
   require completing their modules. No deployment can make 501 stubs functional.

## Organizer folder and evidence

After the final passing source checkpoint:

```powershell
node scripts/prepare-submission.mjs
```

The script creates a NEW unzipped source folder in Windows Temp and prints its
path. It copies only committed regular files, including package-lock.json,
.env.example, README, migrations and docs. It excludes ignored .env.local,
node_modules, .next, .git and .vercel. No remote upload is performed. Upload that
folder's contents into the organizers' designated Google Drive folder. Retain the
folder until submission is confirmed. npm ci installs dependencies on another
machine; clarify any organizer requirement to include them separately.

Capture genuine screenshots in docs/screenshots, add links to README, commit
them, and rerun export. Required submission links: GitHub repo, live Vercel URL,
organizer Google Drive folder. Record real URLs below only after verification:

- GitHub: https://github.com/dawoodahmad018/vspark-social-ai
- Vercel production domain: https://vspark-social-ai.vercel.app (verify deployment status)
- Organizer Drive folder: pending
- Live CRUD / generation / Storage: local API checks passed; production/browser checks pending

References: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs),
[Supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Production environment values were securely transferred by the agent. Do not
re-enter them in command arguments. The exact Google Cloud authorized callback
must be https://vspark-social-ai.vercel.app/api/integrations/drive/callback.
Keep the local callback registered too if testing locally. Drive token RPC is
confirmed available by the successful live OAuth redirect preflight; do not
rerun migration 004 if already applied. Email remains disabled.
