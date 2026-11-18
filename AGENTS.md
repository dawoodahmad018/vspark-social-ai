This subtree is the explicitly requested Next.js web competition app. Use Next.js
App Router here; do not import Expo or modify the parent Expo starter. Read
docs/CONTRACT.md and docs/AGENT_OWNERSHIP.md before edits. Lead owns shared files.
Run npm.cmd run typecheck, npm.cmd run lint and npm.cmd run build after integration.
Never fabricate external-service success or commit secrets.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
