import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  getAdditionalUserInfo,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isAdminUser } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { toast } from 'sonner';

export interface AppUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_metadata: {
    full_name?: string | null;
    avatar_url?: string | null;
    name?: string | null;
    picture?: string | null;
  };
}

interface AuthContextType {
  user: any;
  session: any;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'kintesi_auth_user_session';
const AUTH_PROFILE_KEY = 'kintesi_auth_profile_session';
const EXPLICIT_SIGNOUT_KEY = 'kintesi_user_explicit_signout';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state directly from persistent cache so user is instantly logged in on visit/reload
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      if (localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true') return null;
      const cached = localStorage.getItem(AUTH_USER_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const [session, setSession] = useState<any>(() => {
    try {
      if (localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true') return null;
      const cached = localStorage.getItem(AUTH_USER_KEY);
      if (cached) return { user: JSON.parse(cached) };
    } catch {}
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      if (localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true') return null;
      const cached = localStorage.getItem(AUTH_PROFILE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  // If already authenticated from persistent cache, do not block UI with full loading spinner
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      if (localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true') return false;
      return !localStorage.getItem(AUTH_USER_KEY);
    } catch {
      return true;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const saveUserToStorage = (u: AppUser | null) => {
    setUser(u);
    setSession(u ? { user: u } : null);
    try {
      if (u) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
        localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch {}
  };

  const saveProfileToStorage = (p: UserProfile | null) => {
    setProfile(p);
    try {
      if (p) {
        localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(p));
        localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
      } else {
        localStorage.removeItem(AUTH_PROFILE_KEY);
      }
    } catch {}
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const mapFirebaseUser = (fbUser: FirebaseUser): AppUser => {
    return {
      ...fbUser,
      id: fbUser.uid,
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      user_metadata: {
        full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        avatar_url: fbUser.photoURL || null,
        name: fbUser.displayName,
        picture: fbUser.photoURL,
      },
    };
  };

  const fetchProfile = async (currentUser: AppUser) => {
    try {
      const userEmail = currentUser.email?.toLowerCase().trim() || '';
      const isMasterAdmin = isAdminUser(userEmail);

      let isStaffAdmin = false;
      try {
        const storeDoc = await getDoc(doc(db, 'store_settings', 'default'));
        if (storeDoc.exists()) {
          const authList: string[] = storeDoc.data()?.authorizedAdmins || [];
          if (authList.map((e) => e.toLowerCase().trim()).includes(userEmail)) {
            isStaffAdmin = true;
          }
        }
      } catch {}

      if (!isStaffAdmin) {
        try {
          const localAdmins: string[] = JSON.parse(localStorage.getItem('kintesi_authorized_admins') || '[]');
          if (localAdmins.map((e) => e.toLowerCase().trim()).includes(userEmail)) {
            isStaffAdmin = true;
          }
        } catch {}
      }

      const userDocRef = doc(db, 'profiles', currentUser.id);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        const resolvedRole = isMasterAdmin || isStaffAdmin || data.role === 'admin' ? 'admin' : 'customer';
        const finalProfile: UserProfile = {
          ...data,
          id: currentUser.id,
          role: resolvedRole,
        };
        saveProfileToStorage(finalProfile);

        if (resolvedRole === 'admin' && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' }).catch(() => {});
        }
      } else {
        const resolvedRole = isMasterAdmin || isStaffAdmin ? 'admin' : 'customer';
        const newProfile: UserProfile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Customer',
          email: currentUser.email || '',
          avatar_url: currentUser.photoURL || null,
          role: resolvedRole,
          created_at: new Date().toISOString(),
        };
        saveProfileToStorage(newProfile);
        await setDoc(userDocRef, newProfile).catch(() => {});
        try {
          Promise.resolve(
            supabase.from('profiles').upsert([
              {
                id: currentUser.id,
                email: currentUser.email || '',
                full_name: newProfile.full_name,
                role: resolvedRole,
                avatar_url: currentUser.photoURL || null,
              }
            ])
          ).catch(() => {});
        } catch {}
      }
    } catch (err) {
      console.warn('Firebase profile fetch note:', err);
      // Fallback profile if offline
      const resolvedRole = isAdminUser(currentUser.email) ? 'admin' : 'customer';
      saveProfileToStorage({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'Customer',
        email: currentUser.email || '',
        avatar_url: currentUser.photoURL || null,
        role: resolvedRole,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout so UI never hangs
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (mounted) {
        if (fbUser) {
          localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
          const mapped = mapFirebaseUser(fbUser);
          saveUserToStorage(mapped);
          fetchProfile(mapped).catch(() => {});
        } else {
          // If Firebase reports null, only wipe user if explicit signout occurred
          const wasExplicit = localStorage.getItem(EXPLICIT_SIGNOUT_KEY) === 'true';
          if (wasExplicit) {
            saveUserToStorage(null);
            saveProfileToStorage(null);
          } else {
            // Check if we have persistent cached user - protect session from auto-logout!
            const cachedUser = localStorage.getItem(AUTH_USER_KEY);
            if (!cachedUser) {
              saveUserToStorage(null);
              saveProfileToStorage(null);
            }
          }
        }
        setIsLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Perpetual Session Keep-Alive: Refresh ID token periodically and on tab focus
  useEffect(() => {
    const keepSessionAlive = async () => {
      if (auth.currentUser) {
        try {
          // Force refresh ID token in background to keep session perpetually alive
          await auth.currentUser.getIdToken(true);
        } catch (err) {
          console.warn('Silent session keep-alive notice:', err);
        }
      }
    };

    // Refresh every 20 minutes (tokens normally expire in 60 minutes)
    const interval = setInterval(keepSessionAlive, 20 * 60 * 1000);

    // Refresh when user returns to or focuses the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        keepSessionAlive();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
      const result = await signInWithPopup(auth, googleProvider);
      const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);

      // STRICT RULE 1: If brand new user account, ensure cart and wishlist start 100% empty!
      if (isNewUser) {
        localStorage.removeItem('kintesi_cart');
        localStorage.removeItem('kintesi_wishlist');
        window.dispatchEvent(new Event('kintesi_cart_cleared'));
        window.dispatchEvent(new Event('kintesi_wishlist_cleared'));
        setDoc(doc(db, 'user_carts', result.user.uid), { items: [], updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'user_wishlists', result.user.uid), { items: [], updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }

      const mapped = mapFirebaseUser(result.user);
      saveUserToStorage(mapped);
      await fetchProfile(mapped);
      toast.success('Signed in with Google successfully!');
      closeAuthModal();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      // Don't toast error if user closed the popup window
      if (err?.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const mapped = mapFirebaseUser(result.user);
      saveUserToStorage(mapped);
      await fetchProfile(mapped);
      toast.success('Logged in successfully!');
      return { error: null };
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : err.message || 'Login failed';
      toast.error(msg);
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);

      // STRICT RULE 1: Fresh new user account MUST have empty cart & wishlist!
      localStorage.removeItem('kintesi_cart');
      localStorage.removeItem('kintesi_wishlist');
      window.dispatchEvent(new Event('kintesi_cart_cleared'));
      window.dispatchEvent(new Event('kintesi_wishlist_cleared'));

      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await fbUpdateProfile(result.user, { displayName: name.trim() });

      // Initialize empty in Firestore for the brand new user ID
      setDoc(doc(db, 'user_carts', result.user.uid), { items: [], updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      setDoc(doc(db, 'user_wishlists', result.user.uid), { items: [], updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});

      const mapped = mapFirebaseUser(result.user);
      mapped.displayName = name.trim();
      mapped.user_metadata.full_name = name.trim();
      saveUserToStorage(mapped);
      await fetchProfile(mapped);
      toast.success('Account created successfully!');
      return { error: null };
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email address is already registered'
        : err.message || 'Signup failed';
      toast.error(msg);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      localStorage.setItem(EXPLICIT_SIGNOUT_KEY, 'true');
      localStorage.removeItem('kintesi_cart');
      localStorage.removeItem('kintesi_wishlist');
      await fbSignOut(auth);
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      saveUserToStorage(null);
      saveProfileToStorage(null);
      window.dispatchEvent(new Event('kintesi_cart_cleared'));
      window.dispatchEvent(new Event('kintesi_wishlist_cleared'));
      toast.success('Logged out successfully');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated: UserProfile = {
        ...(profile || {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.displayName || 'Customer',
          role: isAdmin ? 'admin' : 'customer',
          avatar_url: user.photoURL || null,
        }),
        ...updates,
      };

      saveProfileToStorage(updated);

      try {
        const userDocRef = doc(db, 'profiles', user.id);
        await setDoc(userDocRef, updates, { merge: true });
      } catch (err) {
        console.warn('Firestore profile update notice:', err);
      }

      try {
        await supabase.from('profiles').upsert([{
          id: user.id,
          ...updates,
        }]);
      } catch {}
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const isAdmin = profile?.role === 'admin' || isAdminUser(user?.email);
  const isSuperAdmin = isAdminUser(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isSuperAdmin,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
        updateUserProfile,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
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
