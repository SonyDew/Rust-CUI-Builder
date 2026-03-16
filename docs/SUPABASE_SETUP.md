# Supabase Setup

This repository now includes Supabase schema migrations in:

- [`20260316_000001_core_schema.sql`](../supabase/migrations/20260316_000001_core_schema.sql)
- [`20260316_000002_billing_fields.sql`](../supabase/migrations/20260316_000002_billing_fields.sql)

## What the migrations create

- `profiles`
- `user_profiles`
- `projects`
- `notifications`
- `tickets`
- `ticket_messages`
- `ticket-files` storage bucket
- billing metadata columns on `profiles` for Stripe customer/subscription sync
- auth triggers for profile bootstrap
- RLS policies for owners, collaborators, admins, public shares, and support
- realtime publication entries for notifications, tickets, and ticket messages

## Recommended setup order

1. Create a Supabase project.
2. Apply both migrations in the SQL editor or through the Supabase CLI.
3. Copy the project URL and anon key into [`../.env.example`](../.env.example) values in your local `.env.local`.
4. Start the frontend with `npm run dev`.
5. Create the first account through the app.

The first registered user becomes `is_admin = true` automatically.

## Auth configuration

Enable the auth providers you actually want to use:

- Email/password
- Email OTP
- Google OAuth
- Discord OAuth

Useful redirect URLs:

- `http://localhost:5173`
- `http://localhost:5173/auth`
- `http://localhost:5173/auth/desktop-callback`
- your production domain equivalents

Password reset in the frontend uses:

- `/auth?type=recovery`

## Notes on policies

- `profiles` are readable by authenticated users because the project invite flow
  looks up collaborators by email.
- `projects` are readable by owners, admins, collaborators, and public/shareable
  viewers.
- project updates are allowed for owners, admins, and collaborators whose role
  is not `view` or `comment`.
- `tickets` and `ticket_messages` are scoped to the ticket owner, assignee, or
  an admin.

## Manual admin changes

Promote a specific user:

```sql
update public.profiles
set is_admin = true
where email = 'you@example.com';
```

Change a user's plan:

```sql
update public.profiles
set plan = 'team'
where email = 'you@example.com';
```

Valid plans:

- `free`
- `solo`
- `team`

## Realtime

The migration adds these tables to `supabase_realtime`:

- `notifications`
- `tickets`
- `ticket_messages`

That matches the current frontend subscriptions.

## What Supabase still does not cover

Supabase does not replace these HTTP endpoints:

- `/api/security/event`
- `/api/rcui/encrypt`
- `/api/rcui/decrypt`
- `/api/stripe/create-checkout`
- `/api/stripe/subscription/:id`
- `/api/stripe/portal`

Those still belong to the separate backend/API layer.
