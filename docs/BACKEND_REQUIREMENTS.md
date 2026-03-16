# Backend Requirements

This document lists the backend and Supabase pieces the current frontend
expects, based on the code in `src/`.

## Supabase Auth

The app uses Supabase Auth for:

- email/password sign up and sign in
- OTP sign in
- OAuth sign in
- password reset
- profile updates
- session checks and auth state subscriptions

Client env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Database Tables Referenced By The Frontend

### `profiles`

Used for:

- `plan`
- `is_admin`
- `username`
- `email`

### `user_profiles`

Used for:

- `user_id`
- `favorites`
- `onboarding_completed`
- `primary_use`
- `experience_level`
- `project_type`
- `team_size`
- `goals`
- `updated_at`

### `projects`

Used for:

- `id`
- `user_id`
- `name`
- `elements`
- `settings`
- `last_modified`
- `is_deleted`

The frontend also expects `settings` to carry product-specific fields such as
draft state, visibility, collaborators, commands, tags, and background data.

### `notifications`

Used for:

- `id`
- `user_id`
- `type`
- `title`
- `message`
- `metadata`
- `read`
- `created_at`

### `tickets`

Used for:

- `id`
- `user_id`
- `subject`
- `status`
- `updated_at`
- `claimed_by`

### `ticket_messages`

Used for:

- `id`
- `ticket_id`
- `sender_id`
- `message`
- `attachments`
- `created_at`

## Supabase Storage

Bucket used by the frontend:

- `ticket-files`

The current ticket UI uploads files into this bucket and then calls
`getPublicUrl`, so the bucket must be configured accordingly if that behavior
is kept.

## Realtime Usage

The frontend subscribes to:

- `notifications` inserts filtered by `user_id`
- `tickets` changes for the signed-in user
- `ticket_messages` inserts, updates, and deletes filtered by `ticket_id`
- broadcast `typing` events inside per-ticket channels

It also opens these channel patterns:

- `notifications:{userId}`
- `tickets_list`
- `ticket_chat_{ticketId}`
- `global_status`

## HTTP API Endpoints

The frontend expects these routes:

- `POST /api/security/event`
- `POST /api/rcui/encrypt`
- `POST /api/rcui/decrypt`
- `POST /api/stripe/create-checkout`
- `GET /api/stripe/subscription/:id`
- `POST /api/stripe/portal`

## Development Note

`src/utils/projectFile.js` points RCUI requests to `http://localhost:3000` in
development. If you run the frontend on Vite's default port, the API server
must still exist separately on port 3000 unless you change that behavior.

## Local Fallback Behavior

Without backend support:

- editor saves can fall back to local browser storage
- RCUI export/import falls back to plain JSON content if encryption endpoints
  are unavailable
- auth, notifications, plans, and realtime features will not be fully usable
