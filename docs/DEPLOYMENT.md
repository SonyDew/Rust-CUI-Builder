# Deployment Guide

This repository is split into three deployable parts:

- static frontend
- Node API server
- Supabase project

## 1. Supabase

Before deploying anything else:

1. Create a Supabase project.
2. Apply both SQL migrations in [`../supabase/migrations`](../supabase/migrations).
3. Configure auth providers and redirect URLs.
4. Confirm the public `ticket-files` bucket exists.

Reference:

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## 2. API server

The API server can be deployed anywhere Node 20+ is supported.

Required environment variables:

- `API_PORT`
- `APP_URL`
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RCUI_ENCRYPTION_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PORTAL_RETURN_URL`
- `STRIPE_PRICE_SOLO_MONTHLY`
- `STRIPE_PRICE_SOLO_YEARLY`
- `STRIPE_PRICE_TEAM_MONTHLY`
- `STRIPE_PRICE_TEAM_YEARLY`

Recommended production checks:

- `GET /api/health` returns `200`
- Stripe webhook endpoint is reachable
- RCUI encrypt/decrypt works with a real `RCUI_ENCRYPTION_KEY`
- security log path is writable

Reference:

- [API_SETUP.md](./API_SETUP.md)

## 3. Frontend

The frontend is a standard Vite build.

Required client env variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `VITE_ENABLE_CLIENT_SECURITY`

Build command:

```bash
npm run build
```

The output directory is `dist/`.

## Stripe webhook flow

After the API is deployed, point Stripe to:

```text
https://your-api-domain.example/api/stripe/webhook
```

Recommended events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Final pre-launch checklist

- `npm run check` passes
- frontend can sign in against the real Supabase project
- plans page can create a checkout session
- Stripe webhook updates `profiles.plan`
- editor export/import works through `/api/rcui/*`
- support ticket uploads work against Supabase storage
