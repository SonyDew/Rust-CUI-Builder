# Project Audit

Audit date: 2026-03-16

## Summary

The archive `rustcuitoolbeta.rar` was unpacked and inspected. The recovered
material is valuable, but it is not a complete source repository. It is best
described as an archive recovery snapshot that combines:

- a partial `src/` tree with 37 source files
- 25 prebuilt asset bundles under `assets/`
- root web files: `index.html`, `manifest.json`, and `sw.js`

## What The Snapshot Clearly Contains

The recovered source confirms the presence of:

- authentication, account management, onboarding, and plan gating
- a rich dashboard with previews, favorites, tags, trash, and drafts
- Supabase integration for auth, database access, realtime, notifications, and
  storage
- support ticket flows and in-app notification handling
- RCUI export/import with companion API encryption and decryption
- offline queue support plus a service worker
- Windows desktop integration hooks and a release history up to version `1.5.0`

## Major Gaps

The following blockers prevent this snapshot from acting like a clean modern
front-end repository:

- no `package.json`, lockfile, or Vite config
- no documented backend or infrastructure config
- multiple source routes are referenced but absent:
  - `src/components/Editor.jsx`
  - `src/components/AdminDashboard.jsx`
  - `src/components/AdminRoute.jsx`
  - `src/components/ShareView.jsx`
  - `src/components/LegalPage.jsx`
  - `src/components/DesktopAuthCallback.jsx`
- multiple referenced stylesheets are absent:
  - `src/App.css`
  - `src/index.css`
  - `src/components/Auth.css`
  - `src/components/Dashboard.css`
  - `src/components/LegalModal.css`
  - `src/components/SettingsModal.css`
  - `src/components/Skeleton.css`
  - `src/components/Tickets.css`
  - `src/components/PageTransition.css`
  - `src/components/MobileResponsive.css`

## Notable Inconsistencies

- `manifest.json` is not a valid manifest in this snapshot. It contains a
  captured Cloudflare challenge page rather than JSON.
- The extracted root looks like a deployed web bundle, while `src/` looks like
  a partial working tree. That usually means the archive was taken from a mixed
  export directory rather than from the actual source repository root.
- Ownership language inside the UI says `Hex Plugins` and marks the product as
  proprietary. The new root `LICENSE` follows that same direction. If the legal
  owner name has changed, update the holder name before publishing externally.

## External Dependencies Confirmed From Source

The client depends on:

- Supabase via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- custom API endpoints for:
  - `/api/security/event`
  - `/api/rcui/encrypt`
  - `/api/rcui/decrypt`
  - `/api/stripe/create-checkout`
  - `/api/stripe/subscription/:id`
  - `/api/stripe/portal`

## Practical Recovery Order

1. Recover the original repository root, especially `package.json`, lockfiles,
   build config, and missing CSS files.
2. Restore missing route modules, starting with the editor and share flows.
3. Replace the invalid `manifest.json` with a real PWA manifest.
4. Document or restore the companion backend used for security logging, Stripe,
   and RCUI crypto.
5. Validate whether the desktop application code lives in a separate repository
   or was excluded from this archive.

## Recommendation

Treat this repository as a documented recovery snapshot, not as a ready-to-build
application. The added root metadata files are meant to make the archive
understandable and easier to restore, not to hide the fact that the source is
incomplete.
