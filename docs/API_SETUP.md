# API Setup

This repository now includes a Node/Express backend scaffold in
[`server/`](../server).

## Included routes

- `GET /api/health`
- `POST /api/security/event`
- `POST /api/rcui/encrypt`
- `POST /api/rcui/decrypt`
- `POST /api/stripe/create-checkout`
- `GET /api/stripe/subscription/:id`
- `POST /api/stripe/portal`
- `POST /api/stripe/webhook`

## What is already implemented

- RCUI file encryption/decryption with AES-256-GCM
- security event logging to NDJSON
- Stripe checkout session creation
- Stripe customer portal session creation
- Stripe webhook handling for subscription sync
- Supabase service-role integration for profile lookups and billing updates

## Environment variables

Use the API section in [`../.env.example`](../.env.example).

Important values:

- `API_PORT`
- `APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RCUI_ENCRYPTION_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO_MONTHLY`
- `STRIPE_PRICE_SOLO_YEARLY`
- `STRIPE_PRICE_TEAM_MONTHLY`
- `STRIPE_PRICE_TEAM_YEARLY`

## Local development

Run the frontend and API in separate terminals:

```bash
npm run dev
npm run dev:api
```

Or use the combined local workflow:

```bash
npm run dev:full
```

The Vite config proxies `/api/*` to `http://localhost:3000`.

`src/utils/projectFile.js` already calls the API server on port `3000` during
development for RCUI encrypt/decrypt.

## Stripe notes

The backend expects the Supabase billing columns from
[`20260316_000002_billing_fields.sql`](../supabase/migrations/20260316_000002_billing_fields.sql).

Webhook behavior:

- `checkout.session.completed` stores customer/subscription identifiers
- `customer.subscription.created` and `customer.subscription.updated` sync plan
  and billing metadata into `profiles`
- `customer.subscription.deleted` downgrades the profile back to `free`

You still need to register the webhook endpoint in Stripe, for example:

- `http://localhost:3000/api/stripe/webhook` for local testing

## Security event logging

`POST /api/security/event` appends newline-delimited JSON events to the path in
`SECURITY_EVENT_LOG`.

This is deliberately simple so another developer can replace it with a real
log pipeline without changing the frontend.

## Repository checks

Before committing backend changes:

```bash
npm run check
```
