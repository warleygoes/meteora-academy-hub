import { useState, useEffect, createContext, useContext } from 'react';
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

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Verify user still exists in profiles before checking admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (!profile) {
            // User was deleted from DB but still has a session token
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setIsAdmin(false);
            setLoading(false);
            return;
          }
          
          setTimeout(() => checkAdminRole(session.user.id), 0);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Verify user still exists in profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (!profile) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        checkAdminRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
