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
            const status = {
                user_id: user.id,
                email: user.email,
                online_at: new Date().toISOString(),
                location: location.pathname
            };

            await channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track(status);
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
