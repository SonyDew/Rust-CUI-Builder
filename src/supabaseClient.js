import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In the Electron desktop app, use localStorage so the session
// survives across app restarts (sessionStorage is per-webview and ephemeral).
const isDesktop = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
const _storage = isDesktop ? localStorage : sessionStorage;

// On the desktop auth callback page (loaded in Chrome, not Electron) we must
// NOT let Supabase auto-detect & consume the hash tokens — the callback
// component needs to read them and forward via deep link to the desktop app.
const isDesktopCallback = typeof window !== 'undefined' &&
    window.location.pathname === '/auth/desktop-callback';

const sessionStorageAdapter = {
    getItem: (key) => {
        try { return _storage.getItem(key); }
        catch { return null; }
    },
    setItem: (key, value) => {
        try { _storage.setItem(key, value); }
        catch {}
    },
    removeItem: (key) => {
        try { _storage.removeItem(key); }
        catch {}
    },
};

const createMissingConfigError = () => ({
    code: 'CONFIG_MISSING',
    message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud features.'
});

const createQueryBuilder = () => {
    const builder = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        upsert: () => builder,
        eq: () => builder,
        neq: () => builder,
        or: () => builder,
        limit: () => builder,
        order: () => builder,
        match: () => builder,
        single: () => Promise.resolve({ data: null, error: createMissingConfigError() }),
        maybeSingle: () => Promise.resolve({ data: null, error: createMissingConfigError() }),
        then: (resolve, reject) =>
            Promise.resolve({ data: null, error: createMissingConfigError() }).then(resolve, reject)
    };

    return builder;
};

const createFallbackClient = () => ({
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
            data: {
                subscription: {
                    unsubscribe: () => {}
                }
            }
        }),
        signOut: async () => ({ error: createMissingConfigError() }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signUp: async () => ({ data: null, error: createMissingConfigError() }),
        signInWithPassword: async () => ({ data: null, error: createMissingConfigError() }),
        signInWithOtp: async () => ({ data: null, error: createMissingConfigError() }),
        signInWithOAuth: async () => ({ data: null, error: createMissingConfigError() }),
        verifyOtp: async () => ({ data: null, error: createMissingConfigError() }),
        resetPasswordForEmail: async () => ({ data: null, error: createMissingConfigError() }),
        updateUser: async () => ({ data: null, error: createMissingConfigError() })
    },
    from: () => createQueryBuilder(),
    channel: () => {
        const channel = {
            on: () => channel,
            subscribe: () => channel,
            unsubscribe: () => {}
        };

        return channel;
    },
    removeChannel: () => {},
    storage: {
        from: () => ({
            upload: async () => ({ data: null, error: createMissingConfigError() }),
            getPublicUrl: (path) => ({ data: { publicUrl: path } })
        })
    }
});

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: sessionStorageAdapter,
            storageKey: 'rcui-auth',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: !isDesktopCallback,
            ...(isDesktop && { flowType: 'implicit' }),
        },
    })
    : createFallbackClient();

export const isSupabaseConfigured = isConfigured;
