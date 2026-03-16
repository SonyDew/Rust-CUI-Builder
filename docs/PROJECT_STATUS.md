# Project Status

Last updated: 2026-03-16

## Summary

The repository is a working frontend for Rust CUI Builder. It can be started,
built, and used locally without Supabase thanks to a browser-persisted local
mode. The main remaining work is backend integration, schema documentation, and
production hardening.

## Working Today

- React/Vite application shell
- standalone local mode for auth, projects, notifications, tickets, storage,
  and realtime-style UI flows
- committed Supabase schema migration with auth bootstrap, RLS, storage, and
  realtime table wiring
- auth screens and onboarding flow
- dashboard with project browsing, tags, favorites, drafts, and trash
- editor route with local save fallback
- support tickets UI and realtime client hooks
- plans page with backend-aware billing behavior
- share, legal, admin, and desktop callback routes
- service worker and PWA assets

## Known Gaps

- no production backend implementation for Stripe, RCUI encryption, or
  security logging
- no automated test coverage
- desktop application packaging is not part of this repository

## Highest-Priority Next Steps

1. Define and document the backend contract clearly enough that another
   developer can stand up a matching API without reading the whole frontend.
2. Apply and validate the committed Supabase schema against a real project,
   then test auth, invites, storage, and realtime end to end.
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
