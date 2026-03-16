import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import OnboardingSurvey from './OnboardingSurvey';

const OnboardingRoute = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [needsOnboarding, setNeedsOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!user) {
                setLoading(false);
                navigate('/');
                return;
            }

            try {
                // Verify user actually exists on the server (not just a stale JWT)
                const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();
                if (userError || !serverUser) {
                    await supabase.auth.signOut();
                    setLoading(false);
                    navigate('/auth');
                    return;
                }

                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('onboarding_completed')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error checking onboarding status:', error);
                    setNeedsOnboarding(true);
                } else {
                    setNeedsOnboarding(!data?.onboarding_completed);
                }
            } catch (err) {
                console.error('Failed to check onboarding:', err);
                await supabase.auth.signOut();
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            checkOnboarding();
        }
    }, [user, authLoading, navigate]);

    const handleOnboardingComplete = () => {
        setNeedsOnboarding(false);
    };

    if (authLoading || loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#1e1e1e',
                color: '#e0e0e0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(13, 153, 255, 0.2)',
                        borderTopColor: '#0d99ff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (needsOnboarding) {
        return <OnboardingSurvey onComplete={handleOnboardingComplete} />;
    }

    return children;
};

export default OnboardingRoute;
