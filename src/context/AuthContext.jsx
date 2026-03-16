import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { logActivity } from '../utils/activityLogger';
import { generateFingerprint, storeFingerprint, getStoredFingerprint } from '../utils/fingerprint';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const accessLoggedRef = useRef(false);

  const validateSession = () => {
    const stored = getStoredFingerprint();
    if (!stored) {
      const fp = generateFingerprint();
      storeFingerprint(fp);
      return true;
    }
    const current = generateFingerprint();
    return stored === current;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !validateSession()) {
        console.warn('Session fingerprint mismatch. Signing out.');
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        logUserAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !validateSession()) {
        console.warn('Session fingerprint mismatch on auth change. Signing out.');
        supabase.auth.signOut();
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        logUserAccess(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let lastCheck = Date.now();
    const THROTTLE_MS = 30_000;

    const handleInteraction = async () => {
      const now = Date.now();
      if (now - lastCheck < THROTTLE_MS) return;
      lastCheck = now;

      if (!user) return;

      if (!validateSession()) {
        console.warn('Fingerprint mismatch on interaction. Signing out.');
        await supabase.auth.signOut();
        return;
      }

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        console.warn('Session expired or invalid. Signing out.');
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        await supabase.auth.signOut();
      }
    };

    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('keydown', handleInteraction, true);

    return () => {
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('keydown', handleInteraction, true);
    };
  }, [user]);

  const logUserAccess = async (userId) => {
    if (accessLoggedRef.current) return;
    accessLoggedRef.current = true;
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
          logActivity('LOGIN', `User Logged In`, userData.user.email);
      }
    } catch (e) {
      console.error('Error logging access:', e);
    }
  };

  const checkAdmin = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin || false);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshAdminStatus = () => {
    if (user?.id) {
      checkAdmin(user.id);
    }
  };

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signInWithOtp: (data) => supabase.auth.signInWithOtp(data),
    signInWithOAuth: (data) => supabase.auth.signInWithOAuth(data),
    verifyOtp: (data) => supabase.auth.verifyOtp(data),
    resetPasswordForEmail: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?type=recovery` }),
    updateUser: (data) => supabase.auth.updateUser(data),
    signOut: () => supabase.auth.signOut(),
    user,
    session,
    loading,
    isAdmin,
    refreshAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
