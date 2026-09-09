import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAdminUser } from '../lib/supabase';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const userEmail = currentUser.email?.toLowerCase().trim() || '';
      const isMasterAdmin = isAdminUser(userEmail);
      
      // Check remote Supabase store_settings for authorized admins list
      let isStaffAdmin = false;
      try {
        const { data: storeConfig } = await supabase
          .from('store_settings')
          .select('"authorizedAdmins"')
          .eq('id', 'default')
          .single();
        
        if (storeConfig && storeConfig.authorizedAdmins) {
          const authList: string[] = storeConfig.authorizedAdmins;
          if (authList.map((e) => e.toLowerCase().trim()).includes(userEmail)) {
            isStaffAdmin = true;
          }
        }
      } catch {}

      // Fallback local check
      if (!isStaffAdmin) {
        try {
          const localAdmins: string[] = JSON.parse(localStorage.getItem('cartfly_authorized_admins') || '[]');
          if (localAdmins.map((e) => e.toLowerCase().trim()).includes(userEmail)) {
            isStaffAdmin = true;
          }
        } catch {}
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        const resolvedRole = isMasterAdmin || isStaffAdmin || data.role === 'admin' ? 'admin' : 'customer';
        setProfile({
          ...data,
          role: resolvedRole,
        });

        // Ensure role is admin in DB if authorized
        if (resolvedRole === 'admin' && data.role !== 'admin') {
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', currentUser.id);
        }
      } else {
        const resolvedRole = isMasterAdmin || isStaffAdmin ? 'admin' : 'customer';
        const newProfile: UserProfile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Admin User',
          email: currentUser.email || '',
          avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
          role: resolvedRole,
        };
        setProfile(newProfile);

        await supabase.from('profiles').upsert(newProfile);
      }
    } catch (err) {
      console.error('Error handling profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        toast.error(`Google Sign-In Error: ${error.message}`);
        throw error;
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      toast.error(err.message || 'Failed to initialize Google Sign-in');
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success('Logged in successfully!');
      return { error: null };
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success('Account created successfully!');
      return { error: null };
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast.success('Logged out successfully');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const isAdmin = isAdminUser(user?.email) || profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isSuperAdmin: user?.email?.toLowerCase().trim() === 'tamim.hasan2005@gmail.com',
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
