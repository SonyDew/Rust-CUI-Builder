import Stripe from 'stripe';
import { config, hasStripe } from './config.js';
import { httpError } from './http.js';
import { getProfileByCustomerId, getProfileById, updateProfileById } from './supabaseAdmin.js';

let stripeClient;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

export const getStripeClient = () => {
    if (!hasStripe) {
        throw httpError(503, 'Stripe is not configured. Set STRIPE_SECRET_KEY first.');
    }

    if (!stripeClient) {
        stripeClient = new Stripe(config.stripeSecretKey);
    }

    return stripeClient;
};

export const getPriceId = (planId, billing) => {
    const priceId = config.stripePrices?.[planId]?.[billing];
    if (!priceId) {
        throw httpError(503, `Stripe price ID is not configured for ${planId}/${billing}.`);
    }

    return priceId;
};

export const getPlanFromPriceId = (priceId) => {
    for (const [planId, prices] of Object.entries(config.stripePrices)) {
        for (const [billing, configuredPriceId] of Object.entries(prices)) {
            if (configuredPriceId && configuredPriceId === priceId) {
                return { planId, billing };
            }
        }
    }

    return null;
};

export const ensureStripeCustomer = async ({ userId, email }) => {
    const profile = await getProfileById(userId);
    if (profile.stripe_customer_id) {
        return { profile, customerId: profile.stripe_customer_id };
    }

    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
        email,
        metadata: {
            supabaseUserId: userId,
        },
    });

    const nextProfile = await updateProfileById(userId, {
        stripe_customer_id: customer.id,
    });

    return { profile: nextProfile, customerId: customer.id };
};

export const syncProfileFromCheckoutSession = async (session) => {
    const userId = session?.metadata?.userId || session?.client_reference_id;
    if (!userId) return null;

    const patch = {};
    if (session.customer) patch.stripe_customer_id = String(session.customer);
    if (session.subscription) patch.stripe_subscription_id = String(session.subscription);

    if (!Object.keys(patch).length) return null;
    return updateProfileById(userId, patch);
};

export const syncProfileFromSubscription = async (subscription) => {
    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    if (!customerId) return null;

    const profile = await getProfileByCustomerId(customerId);
    if (!profile) return null;

    const primaryItem = subscription.items?.data?.[0];
    const stripePriceId = primaryItem?.price?.id || null;
    const mappedPlan = stripePriceId ? getPlanFromPriceId(stripePriceId) : null;
    const resolvedPlan = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) && mappedPlan
        ? mappedPlan.planId
        : 'free';

    return updateProfileById(profile.id, {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: stripePriceId,
        stripe_subscription_status: subscription.status,
        billing_interval: mappedPlan?.billing || null,
        plan: resolvedPlan,
    });
};

export const clearProfileSubscription = async (customerId) => {
    const profile = await getProfileByCustomerId(customerId);
    if (!profile) return null;

    return updateProfileById(profile.id, {
        stripe_subscription_id: null,
        stripe_price_id: null,
        stripe_subscription_status: 'canceled',
        billing_interval: null,
        plan: 'free',
    });
};
