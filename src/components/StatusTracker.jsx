import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const StatusTracker = () => {
    const { user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel('global_status');

        const trackStatus = async () => {
            const statusPayload = {
                user_id: user.id,
                email: user.email,
                online_at: new Date().toISOString(),
                location: location.pathname
            };

            await channel.subscribe(async (subscriptionStatus) => {
                if (subscriptionStatus === 'SUBSCRIBED') {
                    await channel.track(statusPayload);
                }
            });
        };

        trackStatus();

        return () => {
            channel.unsubscribe();
        };

    }, [user, location.pathname]);

    return null;
};

export default StatusTracker;
