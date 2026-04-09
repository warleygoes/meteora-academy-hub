import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logSystemEvent } from '@/lib/systemLog';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata: Record<string, string | undefined>) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const validateAndSetUser = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Verify user still exists in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', currentSession.user.id)
      .maybeSingle();

    if (!profile) {
      // User was deleted from DB but still has a session token
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentSession.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setSession(currentSession);
    setUser(currentSession.user);
    setIsAdmin(!!roleData);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      validateAndSetUser(initialSession);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Set session/user immediately for responsiveness
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (!newSession?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Defer DB calls to avoid deadlocks in onAuthStateChange
        setTimeout(() => {
          validateAndSetUser(newSession);
        }, 0);
      }
    );

    return () => subscription.unsubscribe();
  }, [validateAndSetUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      logSystemEvent({ action: 'Login', entity_type: 'auth', details: email, level: 'success' });
    }
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, metadata: Record<string, string | undefined>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    logSystemEvent({ action: 'Logout', entity_type: 'auth', level: 'info' });
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
