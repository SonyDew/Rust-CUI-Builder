# Project Audit

Audit date: 2026-03-16

## Summary

This repository is a runnable Vite client for Rust CUI Builder. Core app flows,
the editor, dashboard, auth screens, legal/share/admin routes, and PWA assets
are present. Full production behavior still depends on Supabase and a companion
API layer.

## Current Surface Area

The project currently includes:

- React 18 + Vite application scaffolding
- working `src/` application tree and route coverage
- PWA/public assets and service worker support
- local fallback behavior for editor saves when cloud services are unavailable
- documented environment variables and project metadata files

## Working Areas

- authentication and onboarding UI
- dashboard flows for previews, favorites, tags, drafts, and trash
- visual editor with local save fallback and export support
- support tickets and notification UI
- share, legal, admin, and desktop callback routes
- local development and production builds

## External Services Still Required

The client expects:

- Supabase via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `/api/security/event`
- `/api/rcui/encrypt`
- `/api/rcui/decrypt`
- `/api/stripe/create-checkout`
- `/api/stripe/subscription/:id`
- `/api/stripe/portal`

## Remaining Risks

- Billing, encrypted file handling, and security event logging are not complete
  without backend routes.
- Supabase schema, RLS policies, and storage bucket configuration are not
  bundled in this repository.
- Native desktop packaging is not present here even though the web client
  contains desktop callback support.

## Recommended Next Steps

1. Add a documented backend or local mock endpoints for Stripe, RCUI crypto,
   and security logging.
2. Commit the expected Supabase schema and policy setup.
3. Add smoke tests for auth, dashboard navigation, and editor save/export flows.
4. Continue refining editor UX and admin/share functionality against live data.
