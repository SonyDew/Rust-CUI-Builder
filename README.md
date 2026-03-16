# Rust CUI Builder

Rust CUI Builder is a visual builder for the in-game interfaces used by Rust
servers and plugins. It helps Rust server owners and plugin developers create
menus, buttons, overlays, popups, shops, and other CUI screens in a browser
instead of positioning every element by hand in code.

In one sentence: this is a browser-based constructor for custom Rust server
menus and panels.

In practice, you open the editor, place panels, text, buttons, and images,
preview the layout, save project versions, and export the result for use in
your Rust plugin workflow.

This repository contains the web app itself plus optional backend scaffolding
for auth, cloud sync, billing, and encrypted project files.

## What This Project Does

- lets you design Rust CUI layouts visually
- previews how a menu or panel will look before you wire it into a plugin
- stores projects, drafts, tags, favorites, and shared views
- exports and imports `.rcui` project files
- provides optional cloud features for auth, tickets, notifications, and billing

## Who It Is For

- Rust server owners who want custom in-game UI
- Rust plugin developers who want to build UI faster
- designers working with Rust developers on plugin menus and screens

This is not a cheat or a client-side game mod. It is a tool for building the
interface layer used by Rust server plugins.

## What Is In This Repository

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
