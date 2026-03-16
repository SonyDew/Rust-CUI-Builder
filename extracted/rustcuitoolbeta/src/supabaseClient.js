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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: sessionStorageAdapter,
        storageKey: 'rcui-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: !isDesktopCallback,
        // Desktop OAuth opens in external browser — PKCE code_verifier stays
        // in the webview so the code can't be exchanged in Chrome. Implicit
        // flow puts tokens directly in the URL hash, which works cross-process.
        ...(isDesktop && { flowType: 'implicit' }),
    },
});
