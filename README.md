# Rust CUI Builder

Rust CUI Builder is a React + Vite client for designing Rust game UI layouts in
a visual editor instead of hand-writing every panel and element.

This repository already contains a working web app with auth screens,
dashboard flows, support tickets, plan management UI, share/legal/admin pages,
and a browser-based editor. It also includes Supabase migrations and a backend
API scaffold for cloud features that can be wired up later.

## What is in this repository

- React 18 + Vite frontend
- Node/Express API scaffold for Stripe, security events, and RCUI crypto
- Supabase migrations for app data, access rules, storage, and billing metadata
- visual editor for Rust CUI layouts
- dashboard with favorites, tags, drafts, trash, and previews
- auth and onboarding flows
- support ticket UI with realtime chat
- plan and billing UI
- `.rcui` import/export support
- PWA assets and service worker

## Getting Started

Requirements:

- Node.js 20 or newer
- npm

Install and run the client:

```bash
npm install
npm run dev
```

Run the API scaffold separately for cloud-oriented features:

```bash
npm run dev:api
```

Run frontend and API together:

```bash
npm run dev:full
```

Build for production:

```bash
npm run check
npm run build
```

## Environment

Copy [.env.example](./.env.example) to `.env.local`
and fill in the values you have:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_CLIENT_SECURITY=false` for local debugging if you need to bypass
  the browser-side security overlay

Without Supabase credentials the app now falls back to a built-in local mode.
In local mode you can sign in, create projects, complete onboarding, use the
editor, export/import `.rcui` files, browse notifications, and test support
tickets entirely in the browser. Stripe billing and production cloud sync still
require the real backend.

## Project Layout

```text
Rust-CUI-Builder/
|- src/                 # app source
|- server/              # Node API scaffold for Stripe, RCUI crypto, and logging
|- supabase/            # Supabase migrations for core app and billing data
|- scripts/             # repository utility checks
|- public/              # static files, icons, service worker assets
|- assets/              # imported CSS bundles used by current screens
|- docs/                # contributor-facing project documentation
|- README.md
|- CONTRIBUTING.md
|- CHANGELOG.md
|- LICENSE
|- package.json
\- vite.config.js
```

## Current State

Working in the frontend today:

- standalone local mode with browser-persisted auth and data
- committed Supabase schema migration with auth bootstrap, RLS, storage, and realtime wiring
- committed API scaffold for Stripe, RCUI encryption, and security logging
- auth and onboarding UI
- dashboard navigation and project management views
- editor with local save/sync fallback
- support ticket screens and realtime hooks
- plans page with local-mode billing guardrails
- share, legal, admin, and desktop callback routes

Still missing or external:

- live Supabase project with the expected schema, policies, and storage bucket
- real Stripe credentials, price IDs, webhook registration, and deployment wiring
- automated tests
- desktop packaging code

## Continuing Development

If you want to keep building the project, start here:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/BACKEND_REQUIREMENTS.md](./docs/BACKEND_REQUIREMENTS.md)
- [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- [docs/API_SETUP.md](./docs/API_SETUP.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [CHANGELOG.md](./CHANGELOG.md)

## License

This repository is not open source. See [LICENSE](./LICENSE)
before copying, redistributing, or contributing to the codebase.
