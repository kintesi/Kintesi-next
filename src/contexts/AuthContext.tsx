import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isAdminUser } from '../lib/firebase';
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
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

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
        setProfile({
          ...data,
          id: currentUser.id,
          role: resolvedRole,
        });

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
        setProfile(newProfile);
        await setDoc(userDocRef, newProfile).catch(() => {});
      }
    } catch (err) {
      console.warn('Firebase profile fetch note:', err);
      // Fallback profile if offline
      const resolvedRole = isAdminUser(currentUser.email) ? 'admin' : 'customer';
      setProfile({
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
          const mapped = mapFirebaseUser(fbUser);
          setUser(mapped);
          setSession({ user: mapped });
          fetchProfile(mapped).catch(() => {});
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
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

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const mapped = mapFirebaseUser(result.user);
      setUser(mapped);
      setSession({ user: mapped });
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
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const mapped = mapFirebaseUser(result.user);
      setUser(mapped);
      setSession({ user: mapped });
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
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await fbUpdateProfile(result.user, { displayName: name.trim() });
      const mapped = mapFirebaseUser(result.user);
      mapped.displayName = name.trim();
      mapped.user_metadata.full_name = name.trim();
      setUser(mapped);
      setSession({ user: mapped });
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
    await fbSignOut(auth);
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
