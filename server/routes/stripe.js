import express from 'express';
import { config } from '../lib/config.js';
import { asyncHandler, httpError } from '../lib/http.js';
import { getProfileById, requireAuthedUser } from '../lib/supabaseAdmin.js';
import {
    clearProfileSubscription,
    ensureStripeCustomer,
    getPriceId,
    getStripeClient,
    syncProfileFromCheckoutSession,
    syncProfileFromSubscription,
} from '../lib/stripeBilling.js';

const router = express.Router();

router.post('/create-checkout', express.json({ limit: '256kb' }), asyncHandler(async (req, res) => {
    const { planId, billing, userId, userEmail } = req.body || {};
    if (!['solo', 'team'].includes(planId)) {
        throw httpError(400, 'Unsupported plan ID.');
    }
    if (!['monthly', 'yearly'].includes(billing)) {
        throw httpError(400, 'Unsupported billing interval.');
    }

    const authedUser = await requireAuthedUser(req);
    const requesterProfile = await getProfileById(authedUser.id);
    if (!requesterProfile.is_admin && authedUser.id !== userId) {
        throw httpError(403, 'You cannot create a checkout session for another user.');
    }

    const { customerId } = await ensureStripeCustomer({
        userId,
        email: userEmail || authedUser.email,
    });

    const stripe = getStripeClient();
    const priceId = getPriceId(planId, billing);
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        success_url: `${config.appUrl}/plans?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.appUrl}/plans?stripe=cancelled`,
        metadata: {
            userId,
            planId,
            billing,
        },
    });

    res.json({ url: session.url });
}));

router.get('/subscription/:id', asyncHandler(async (req, res) => {
    const authedUser = await requireAuthedUser(req);
    const requesterProfile = await getProfileById(authedUser.id);
    const targetUserId = req.params.id;

    if (!requesterProfile.is_admin && authedUser.id !== targetUserId) {
        throw httpError(403, 'You cannot view subscription data for another user.');
    }

    const profile = await getProfileById(targetUserId);
    res.json({
        customerId: profile.stripe_customer_id || null,
        subscriptionId: profile.stripe_subscription_id || null,
        status: profile.stripe_subscription_status || null,
        billing: profile.billing_interval || null,
        plan: profile.plan || 'free',
    });
}));

router.post('/portal', express.json({ limit: '256kb' }), asyncHandler(async (req, res) => {
    const { customerId } = req.body || {};
    if (!customerId) {
        throw httpError(400, 'Missing Stripe customer ID.');
    }

    const authedUser = await requireAuthedUser(req);
    const profile = await getProfileById(authedUser.id);
    if (!profile.is_admin && profile.stripe_customer_id !== customerId) {
        throw httpError(403, 'You cannot open a billing portal session for another customer.');
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: config.stripePortalReturnUrl,
    });

    res.json({ url: session.url });
}));

router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
    if (!config.stripeWebhookSecret) {
        throw httpError(503, 'STRIPE_WEBHOOK_SECRET is not configured.');
    }

    const stripe = getStripeClient();
    const signature = req.get('stripe-signature');
    if (!signature) {
        throw httpError(400, 'Missing Stripe signature header.');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret);
    } catch (error) {
        throw httpError(400, 'Invalid Stripe webhook signature.', error.message);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            await syncProfileFromCheckoutSession(event.data.object);
            break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            await syncProfileFromSubscription(event.data.object);
            break;
        case 'customer.subscription.deleted': {
            const customerId = typeof event.data.object.customer === 'string'
                ? event.data.object.customer
                : event.data.object.customer?.id;
            if (customerId) {
                await clearProfileSubscription(customerId);
            }
            break;
        }
        default:
            break;
    }

    res.json({ received: true });
}));

export default router;
