 # Secure Election Portal (elect-sphere-io)

Lightweight React + Vite frontend for a secure election system integrated with Supabase. Includes admin tooling (voter/candidate/admin management, files, audit logs, analytics), voter profile & voting flows, and UI primitives.

## Quick links
- App entry: [src/main.tsx](src/main.tsx) and [src/App.tsx](src/App.tsx)  
- Supabase client: [`supabase`](src/integrations/supabase/client.ts) — [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)  
- DB types: [`Database`](src/integrations/supabase/types.ts) — [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts)  
- Validation schemas: [`candidateSchema`, `profileSchema`, `adminEmailSchema`](src/lib/validation.ts) — [src/lib/validation.ts](src/lib/validation.ts)  
- Admin guard: [`AdminRoute`](src/components/auth/AdminRoute.tsx) — [src/components/auth/AdminRoute.tsx](src/components/auth/AdminRoute.tsx)  
- Admin Voters page: [`Voters`](src/pages/admin/Voters.tsx) — [src/pages/admin/Voters.tsx](src/pages/admin/Voters.tsx)  
- Dev config: [vite.config.ts](vite.config.ts) • [tailwind.config.ts](tailwind.config.ts) • [package.json](package.json)  
- Supabase migrations: [supabase/migrations](supabase/migrations) (example: [20251015141003_51720699-9579-451e-baa1-67f4952a3906.sql](supabase/migrations/20251015141003_51720699-9579-451e-baa1-67f4952a3906.sql), [20251017034409_aff4a418-3902-453f-b1b2-508b4c6ce591.sql](supabase/migrations/20251017034409_aff4a418-3902-453f-b1b2-508b4c6ce591.sql))

## Prerequisites
- Node.js (recommended LTS)
- npm (or pnpm/yarn)
- Supabase project (for auth, DB, and storage)

This repository is often run inside a Dev Container (Ubuntu 24.04.2 LTS). To open URLs from the container in the host browser use:
$BROWSER <url>

## Environment
Create a `.env` in the repo root or set environment variables. See [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts).

Minimum variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

File reference: [.env](.env)

## Setup & Local Development

1. Install dependencies
```bash
npm install
```

2. Start development server (Vite listens on port 8080 per [vite.config.ts](vite.config.ts)):
```bash
npm run dev
# open http://localhost:8080
```

3. Build for production:
```bash
npm run build
npm run preview
```

Common scripts live in: [package.json](package.json)

## Supabase
- The app uses a typed Supabase client at [`supabase`](src/integrations/supabase/client.ts). See [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts).
- DB schema and migrations are in [supabase/migrations](supabase/migrations). Apply migrations using your Supabase workflow / CLI to provision tables, RLS policies and triggers.

Types describing the DB are generated to [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) — refer to [`Database`](src/integrations/supabase/types.ts).

## Features overview
- Auth & profile flows: [src/pages/Auth.tsx](src/pages/Auth.tsx), [src/pages/voter/Profile.tsx](src/pages/voter/Profile.tsx)
- Voting: [src/pages/voter/Vote.tsx](src/pages/voter/Vote.tsx) (includes device fingerprinting and IP checks)
- Candidate registration: [src/pages/candidate/Register.tsx](src/pages/candidate/Register.tsx)
- Admin area (protected by [`AdminRoute`](src/components/auth/AdminRoute.tsx)):
  - Elections: [src/pages/admin/Elections.tsx](src/pages/admin/Elections.tsx)
  - Positions: [src/pages/admin/Positions.tsx](src/pages/admin/Positions.tsx)
  - Voters: [src/pages/admin/Voters.tsx](src/pages/admin/Voters.tsx)
  - Files: [src/pages/admin/Files.tsx](src/pages/admin/Files.tsx)
  - Audit logs: [src/pages/admin/AuditLogs.tsx](src/pages/admin/AuditLogs.tsx)
  - Analytics: [src/pages/admin/Analytics.tsx](src/pages/admin/Analytics.tsx)
  - Results: [src/pages/admin/Results.tsx](src/pages/admin/Results.tsx)

UI primitives (reusable components) live under: [src/components/ui](src/components/ui) (card, dialog, input, toast, sidebar, etc.). Example: [src/components/ui/dialog.tsx](src/components/ui/dialog.tsx).

## Validation
Zod schemas are defined in [src/lib/validation.ts](src/lib/validation.ts). Examples used across pages:
- [`candidateSchema`](src/lib/validation.ts)
- [`profileSchema`](src/lib/validation.ts)
- [`adminEmailSchema`](src/lib/validation.ts)

## Storage & Files
- Buckets are managed via Supabase Storage. Admin file browser is implemented at [src/pages/admin/Files.tsx](src/pages/admin/Files.tsx).
- Uploaded public files use Supabase public URLs; private files are referenced by object path and served with signed URLs when needed.

## Migrations & Security
- RLS policies, triggers, and audit logging are included in the migration SQL files under [supabase/migrations](supabase/migrations).
- Example security-related migration: [20251017034409_aff4a418-3902-453f-b1b2-508b4c6ce591.sql](supabase/migrations/20251017034409_aff4a418-3902-453f-b1b2-508b4c6ce591.sql)

## Linting & Formatting
- ESLint config: [eslint.config.js](eslint.config.js)
- Tailwind configuration: [tailwind.config.ts](tailwind.config.ts)
- Vite config: [vite.config.ts](vite.config.ts)

## Deployment
- Vercel configuration file: [vercel.json](vercel.json)
- Build output is the Vite production bundle. Ensure environment variables are set in the deployment platform.

## Notes & troubleshooting
- If auth or DB operations fail, verify Supabase env vars and DB migrations.
- Storage signed URLs are generated via the Supabase client — see [src/pages/admin/Voters.tsx](src/pages/admin/Voters.tsx) for examples of `createSignedUrl` and fallback download logic.
- For frontend routing and pages, see [src/App.tsx](src/App.tsx).

If you need a specific development workflow (migrations, seeding, local Supabase setup), indicate which area and I will provide concise commands and examples.