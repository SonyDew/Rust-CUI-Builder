import path from 'node:path';

const appUrl = process.env.APP_URL || 'http://localhost:5173';

export const config = {
    apiPort: Number.parseInt(process.env.API_PORT || '3000', 10),
    appUrl,
    securityEventLog: process.env.SECURITY_EVENT_LOG || path.resolve(process.cwd(), 'server', 'logs', 'security-events.ndjson'),
    rcuiEncryptionKey: process.env.RCUI_ENCRYPTION_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePortalReturnUrl: process.env.STRIPE_PORTAL_RETURN_URL || `${appUrl}/plans`,
    stripePrices: {
        solo: {
            monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY || '',
            yearly: process.env.STRIPE_PRICE_SOLO_YEARLY || '',
        },
        team: {
            monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || '',
            yearly: process.env.STRIPE_PRICE_TEAM_YEARLY || '',
        },
    },
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export const hasRcuiEncryption = Boolean(config.rcuiEncryptionKey);
export const hasStripe = Boolean(config.stripeSecretKey);
export const hasSupabaseAdmin = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
