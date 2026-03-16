# Contributing

Rust CUI Builder is a proprietary repository. Only contributors who have been
authorized by the owner should work in this codebase or submit changes.

## Prerequisites

- Node.js 20 or newer
- npm
- a Supabase project if you want to test cloud-backed flows
- Stripe test credentials if you want to test billing end to end

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

3. Start the dev server:

```bash
npm run dev
```

Or start frontend and API together:

```bash
npm run dev:full
```

4. Before committing, run the repository checks:

```bash
npm run check
```

## Development Modes

You can work in two practical modes:

- Frontend-only mode: no Supabase credentials, useful for layout work, route
  wiring, local editor behavior, and static UI cleanup.
- Connected mode: valid Supabase credentials plus backend routes, needed for
  auth, notifications, support tickets, plan state, and full project sync.

## Where to Start

Good next areas for contributors:

- connect the committed Supabase/API scaffolding to real hosted services
- add automated smoke tests for auth, dashboard, editor, and ticket flows
- improve editor UX and data validation
- tighten admin/share flows against live data
- add deployment automation for frontend, API, and Supabase migrations

## Project Conventions

- Keep changes scoped. Small focused PRs are easier to review and safer to test.
- Do not commit `dist/`, `node_modules/`, or local env files.
- Prefer direct fixes over broad refactors unless the refactor is necessary to
  unlock a feature.
- The project currently has no linter or automated test suite, so manual
  verification matters.

## Manual Checks Before Opening a PR

- `npm run check` succeeds
- `/auth` still renders and basic auth actions do not crash
- `/dashboard` still loads
- `/editor/:projectId` still opens and saves locally when Supabase is missing
- `/plans`, `/share/:projectId`, and `/legal/:type` still render
- support ticket UI still opens from the dashboard
- `/api/health` responds if the API server is running

## Useful Reference Files

- [README.md](./README.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/BACKEND_REQUIREMENTS.md](./docs/BACKEND_REQUIREMENTS.md)
- [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- [docs/API_SETUP.md](./docs/API_SETUP.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [CHANGELOG.md](./CHANGELOG.md)
