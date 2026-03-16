# Project Status

Last updated: 2026-03-16

## Summary

The repository is a working frontend for Rust CUI Builder. It can be started,
built, and navigated locally. The main remaining work is backend integration,
schema documentation, and production hardening.

## Working Today

- React/Vite application shell
- auth screens and onboarding flow
- dashboard with project browsing, tags, favorites, drafts, and trash
- editor route with local draft fallback
- support tickets UI and realtime client hooks
- plans page and billing handoff UI
- share, legal, admin, and desktop callback routes
- service worker and PWA assets

## Known Gaps

- no backend implementation for Stripe, RCUI encryption, or security logging
- no committed Supabase schema or RLS policies
- no automated test coverage
- desktop application packaging is not part of this repository

## Highest-Priority Next Steps

1. Define and document the backend contract clearly enough that another
   developer can stand up a matching API without reading the whole frontend.
2. Commit the Supabase schema used by the app, especially plans, profiles,
   notifications, tickets, and project storage.
3. Add smoke tests for the main user journeys:
   auth, dashboard, editor, export/import, and support tickets.
4. Review editor save behavior and cloud/local fallback paths for edge cases.

## Good Entry Points For Contributors

- `src/components/Dashboard.jsx`
- `src/components/Editor.jsx`
- `src/components/SupportTicket.jsx`
- `src/context/AuthContext.jsx`
- `src/context/PlanContext.jsx`
- `src/utils/projectFile.js`

## Practical Definition Of "More Complete"

The project will be much easier to hand off once it has:

- documented backend endpoints
- reproducible Supabase setup
- at least a small automated test suite
- clearer deployment instructions
- a stable release checklist
