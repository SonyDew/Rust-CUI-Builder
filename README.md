# Rust CUI Builder

Rust CUI Builder is a React + Vite client for designing Rust game UI layouts in
a visual editor instead of hand-writing every panel and element.

This repository already contains a working web app with auth screens,
dashboard flows, support tickets, plan management UI, share/legal/admin pages,
and a browser-based editor. Some product features still depend on Supabase and
backend routes that are not included here.

## What is in this repository

- React 18 + Vite frontend
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

Build for production:

```bash
npm run build
```

## Environment

Copy [.env.example](./.env.example) to `.env.local`
and fill in the values you have:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_CLIENT_SECURITY=false` for local debugging if you need to bypass
  the browser-side security overlay

Without Supabase credentials the app still starts, but cloud-backed features
such as auth, notifications, sync, and billing cannot work.

## Project Layout

```text
Rust-CUI-Builder/
|- src/                 # app source
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

- auth and onboarding UI
- dashboard navigation and project management views
- editor with local draft fallback
- support ticket screens and realtime hooks
- plans page and Stripe handoff UI
- share, legal, admin, and desktop callback routes

Still missing or external:

- live Supabase project with the expected schema, policies, and storage bucket
- backend routes for Stripe, RCUI encryption, and security events
- automated tests
- desktop packaging code

## Continuing Development

If you want to keep building the project, start here:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/BACKEND_REQUIREMENTS.md](./docs/BACKEND_REQUIREMENTS.md)
- [CHANGELOG.md](./CHANGELOG.md)

## License

This repository is not open source. See [LICENSE](./LICENSE)
before copying, redistributing, or contributing to the codebase.
