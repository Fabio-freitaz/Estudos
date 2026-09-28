import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseSession, isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const demoUser = {
  id: 'demo-user',
  email: 'demo@estudapdf.com',
  full_name: 'Usuário Demo',
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isSupabaseConfigured) {
        setUser(demoUser);
        setSession({ user: demoUser });
        setLoading(false);
        return;
      }

      const { data } = await getSupabaseSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user || null);
      });

      return () => authListener.subscription.unsubscribe();
    };

    bootstrap();
  }, []);

  const signUp = async ({ email, password, fullName }) => {
    if (!isSupabaseConfigured) {
      setUser({ ...demoUser, email, full_name: fullName || demoUser.full_name });
      setSession({ user: { ...demoUser, email, full_name: fullName || demoUser.full_name } });
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (!error && data.user) {
      setUser(data.user);
      setSession({ user: data.user });
    }

    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      setUser({ ...demoUser, email, full_name: demoUser.full_name });
      setSession({ user: { ...demoUser, email, full_name: demoUser.full_name } });
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      setSession({ user: data.user });
    }
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }

    return supabase.auth.resetPasswordForEmail(email);
  };

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
    signUp,
    signIn,
    signOut,
    resetPassword,
  }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
