import { createClient } from '@supabase/supabase-js';
import { config, hasSupabaseAdmin } from './config.js';
import { httpError } from './http.js';

let supabaseAdmin;

export const getSupabaseAdmin = () => {
    if (!hasSupabaseAdmin) {
        throw httpError(503, 'Supabase server credentials are not configured.');
    }

    if (!supabaseAdmin) {
        supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    return supabaseAdmin;
};

const getBearerToken = (req) => {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return null;
    return header.slice('Bearer '.length).trim();
};

export const requireAuthedUser = async (req) => {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
        throw httpError(401, 'Missing bearer token.');
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
        throw httpError(401, 'Invalid or expired access token.');
    }

    return data.user;
};

export const getProfileById = async (userId) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        const statusCode = error.code === 'PGRST116' ? 404 : 500;
        throw httpError(statusCode, `Failed to load profile for user ${userId}.`, error);
    }

    return data;
};

export const getProfileByCustomerId = async (customerId) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

    if (error) {
        throw httpError(500, `Failed to load profile for Stripe customer ${customerId}.`, error);
    }

    return data;
};

export const updateProfileById = async (userId, patch) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select('*')
        .single();

    if (error) {
        throw httpError(500, `Failed to update profile for user ${userId}.`, error);
    }

    return data;
};
