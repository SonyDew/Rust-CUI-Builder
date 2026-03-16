import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowLeft, Zap, Users, Crown, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { isLocalMode } from '../supabaseClient';
import { BRAND_ASSETS } from '../utils/brandAssets';
import './PlansPage.css';

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Perfect for getting started with Rust CUI building.',
        icon: Zap,
        features: [
            { text: '3 projects', included: true },
            { text: '50 elements per project', included: true },
            { text: 'Basic CUI components', included: true },
            { text: 'Code export (C#)', included: true },
            { text: 'Community templates', included: true },
            { text: '720p canvas', included: true },
            { text: 'Custom asset uploads', included: false },
            { text: 'Team collaboration', included: false },
            { text: 'Priority support', included: false },
        ],
    },
    {
        id: 'solo',
        name: 'Solo',
        price: '$8',
        yearlyPrice: '$6',
        period: '/month',
        description: 'For serious builders who need full power.',
        icon: Crown,
        popular: true,
        features: [
            { text: 'Unlimited projects', included: true },
            { text: 'Unlimited elements', included: true },
            { text: 'All CUI components', included: true },
            { text: 'Code export (C#)', included: true },
            { text: 'All templates', included: true },
            { text: '4K canvas', included: true },
            { text: 'Custom asset uploads (500 MB)', included: true },
            { text: 'Snippet library', included: true },
            { text: 'Priority support', included: true },
        ],
    },
    {
        id: 'team',
        name: 'Team',
        price: '$20',
        yearlyPrice: '$16',
        period: '/month',
        description: 'Build together with real-time collaboration.',
        icon: Users,
        features: [
            { text: 'Everything in Solo', included: true },
            { text: 'Up to 10 members', included: true },
            { text: 'Real-time collaboration', included: true },
            { text: 'Shared project library', included: true },
            { text: 'Team asset manager (2 GB)', included: true },
            { text: 'Role-based permissions', included: true },
            { text: 'Version history', included: true },
            { text: 'Dedicated support', included: true },
        ],
    },
];

const PlansPage = () => {
    const navigate = useNavigate();
    const { user, session } = useAuth();
    const { plan: currentPlan, loading: planLoading } = usePlan();
    const { showToast } = useToast();
    const [billing, setBilling] = useState('monthly');
    const [loadingPlan, setLoadingPlan] = useState(null);

    const handleUpgrade = async (planId) => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (planId === 'free' || planId === currentPlan) return;
        if (isLocalMode) {
            showToast('Billing is disabled in local mode. Configure the Stripe backend to enable plan changes.', 'info');
            return;
        }

        setLoadingPlan(planId);
        try {
            const res = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    planId,
                    billing,
                    userId: user.id,
                    userEmail: user.email,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                showToast(data.error || 'Failed to start checkout', 'error');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            showToast('Failed to connect to payment server', 'error');
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleManageSubscription = async () => {
        if (isLocalMode) {
            showToast('Subscription management is unavailable in local mode.', 'info');
            return;
        }
        try {
            const res = await fetch(`/api/stripe/subscription/${user.id}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            if (data.customerId) {
                const portalRes = await fetch('/api/stripe/portal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({ customerId: data.customerId }),
                });
                const portalData = await portalRes.json();
                if (portalData.url) {
                    window.location.href = portalData.url;
                }
            }
        } catch (err) {
            console.error('Portal error:', err);
        }
    };

    const getCtaText = (planId) => {
        if (planLoading) return '...';
        if (planId === currentPlan) return 'Current Plan';
        if (isLocalMode) return 'Cloud Billing';
        if (planId === 'free') return currentPlan === 'free' ? 'Current Plan' : 'Downgrade';
        if (currentPlan !== 'free' && planId !== currentPlan) return 'Switch Plan';
        return 'Upgrade';
    };

    const isDisabled = (planId) => {
        if (isLocalMode) return planId !== currentPlan;
        return planId === currentPlan || planId === 'free';
    };

    return (
        <div className="plans-page">
            <div className="plans-header">
                <button className="plans-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>

                <div className="plans-logo" onClick={() => navigate('/')}>
                    <img src={BRAND_ASSETS.logo} alt="Rust CUI Builder" />
                </div>

                <div className="plans-header-text">
                    <h1>Choose Your Plan</h1>
                    <p>Simple pricing. No hidden fees. Upgrade anytime.</p>
                </div>

                <div className="billing-toggle">
                    <button
                        className={`billing-option ${billing === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBilling('monthly')}
                    >
                        Monthly
                    </button>
                    <button
                        className={`billing-option ${billing === 'yearly' ? 'active' : ''}`}
                        onClick={() => setBilling('yearly')}
                    >
                        Yearly
                        <span className="billing-save">Save 20%</span>
                    </button>
                </div>
            </div>

            {isLocalMode && (
                <div style={{
                    maxWidth: '1120px',
                    margin: '0 auto 24px',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(13, 153, 255, 0.24)',
                    background: 'rgba(13, 153, 255, 0.08)',
                    color: '#d7ecff',
                    lineHeight: 1.45,
                }}>
                    Local mode unlocks the app for development and testing. Billing, checkout, and customer portal actions stay disabled until the Stripe API routes are wired up.
                </div>
            )}

            <div className="plans-grid">
                {plans.map((plan, index) => {
                    const PlanIcon = plan.icon;
                    const displayPrice = billing === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
                    const displayPeriod = plan.price === '$0' ? 'forever' : '/month';
                    const isCurrent = plan.id === currentPlan;
                    const isLoading = loadingPlan === plan.id;

                    return (
                        <div
                            className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                            key={plan.id}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {plan.popular && (
                                <div className="popular-badge">
                                    <Sparkles size={12} />
                                    Most Popular
                                </div>
                            )}

                            <div className="plan-card-icon">
                                <PlanIcon size={22} />
                            </div>

                            <h3 className="plan-card-name">{plan.name}</h3>
                            <p className="plan-card-desc">{plan.description}</p>

                            <div className="plan-card-pricing">
                                <span className="plan-card-price">{displayPrice}</span>
                                <span className="plan-card-period">{displayPeriod}</span>
                                {billing === 'yearly' && plan.yearlyPrice && (
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                        billed ${plan.id === 'solo' ? '76.80' : '192'}/year
                                    </span>
                                )}
                            </div>

                            <button
                                className={`plan-card-cta ${isCurrent ? 'current' : ''}`}
                                disabled={isDisabled(plan.id) || isLoading}
                                onClick={() => handleUpgrade(plan.id)}
                            >
                                {isLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                                    </span>
                                ) : (
                                    getCtaText(plan.id)
                                )}
                            </button>

                            <div className="plan-card-divider" />

                            <div className="plan-card-features">
                                {plan.features.map((f, i) => (
                                    <div className={`plan-card-feature ${f.included ? '' : 'excluded'}`} key={i}>
                                        {f.included
                                            ? <Check size={15} className="feature-check" />
                                            : <X size={15} className="feature-x" />
                                        }
                                        <span>{f.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isLocalMode && currentPlan !== 'free' && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                        onClick={handleManageSubscription}
                        style={{
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#aaa',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                        }}
                    >
                        <ExternalLink size={14} />
                        Manage Subscription
                    </button>
                </div>
            )}

            <div className="plans-page-footer">
                <p>All plans include SSL encryption, 99.9% uptime, and community access.</p>
                <div className="plans-page-links">
                    <button onClick={() => navigate('/legal/terms')}>Terms</button>
                    <span>·</span>
                    <button onClick={() => navigate('/legal/privacy')}>Privacy</button>
                    <span>·</span>
                    <button onClick={() => navigate('/')}>Home</button>
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
