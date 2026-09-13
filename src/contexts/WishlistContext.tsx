import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('kintesi_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasMergedInitialRef = useRef<string | null>(null);

  // Sync with Firestore database whenever user is logged in
  useEffect(() => {
    if (!user || !user.id) return;

    const userWishlistRef = doc(db, 'user_wishlists', user.id);
    const userProfileRef = doc(db, 'profiles', user.id);

    // Initial load: fetch once and merge any guest offline items only on first connect
    if (hasMergedInitialRef.current !== user.id) {
      hasMergedInitialRef.current = user.id;
      setIsLoading(true);

      getDoc(userWishlistRef).then((snapshot) => {
        setIsLoading(false);
        if (snapshot.exists()) {
          const remoteItems: Product[] = snapshot.data()?.items || [];
          setWishlist((currentLocal) => {
            const remoteIds = new Set(remoteItems.map((p) => p.id));
            const localOnlyItems = currentLocal.filter((p) => !remoteIds.has(p.id));
            const merged = [...remoteItems, ...localOnlyItems];

            try {
              localStorage.setItem('kintesi_wishlist', JSON.stringify(merged));
            } catch {}

            if (localOnlyItems.length > 0) {
              setDoc(
                userWishlistRef,
                { items: merged, updatedAt: new Date().toISOString() },
                { merge: true }
              ).catch(() => {});
            }

            return merged;
          });
        } else {
          // Check fallback profiles collection
          getDoc(userProfileRef).then((profSnap) => {
            if (profSnap.exists() && Array.isArray(profSnap.data()?.wishlist) && profSnap.data()?.wishlist.length > 0) {
              const profileItems: Product[] = profSnap.data()?.wishlist || [];
              setWishlist(profileItems);
              try {
                localStorage.setItem('kintesi_wishlist', JSON.stringify(profileItems));
              } catch {}
              setDoc(
                userWishlistRef,
                { items: profileItems, updatedAt: new Date().toISOString() },
                { merge: true }
              ).catch(() => {});
            } else {
              setWishlist((curr) => {
                if (curr.length > 0) {
                  setDoc(
                    userWishlistRef,
                    { items: curr, updatedAt: new Date().toISOString() },
                    { merge: true }
                  ).catch(() => {});
                }
                return curr;
              });
            }
          }).catch(() => {});
        }
      }).catch((error) => {
        console.warn('Initial wishlist fetch note:', error);
        setIsLoading(false);
      });
    }

    // Real-time listener: updates wishlist when modified from another device/browser
    const unsubscribe = onSnapshot(
      userWishlistRef,
      (snapshot) => {
        // Skip in-flight local writes to prevent echo/resurrection
        if (snapshot.metadata.hasPendingWrites) return;

        if (snapshot.exists()) {
          const remoteItems: Product[] = snapshot.data()?.items || [];
          setWishlist(remoteItems);
          try {
            localStorage.setItem('kintesi_wishlist', JSON.stringify(remoteItems));
          } catch {}
        }
      },
      (error) => {
        console.warn('Firestore wishlist real-time sync notice:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Save changes locally and persist to database
  const persistWishlist = (newList: Product[]) => {
    setWishlist(newList);
    try {
      localStorage.setItem('kintesi_wishlist', JSON.stringify(newList));
    } catch {}

    if (user && user.id) {
      const userWishlistRef = doc(db, 'user_wishlists', user.id);
      const userProfileRef = doc(db, 'profiles', user.id);

      setDoc(
        userWishlistRef,
        { items: newList, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch((err) => console.warn('Failed saving wishlist to database:', err));

      setDoc(
        userProfileRef,
        { wishlist: newList },
        { merge: true }
      ).catch(() => {});
    }
  };

  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    let updated: Product[];
    if (exists) {
      updated = wishlist.filter((item) => item.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    persistWishlist(updated);
  };

  const removeFromWishlist = (productId: string) => {
    const updated = wishlist.filter((item) => item.id !== productId);
    persistWishlist(updated);
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearWishlist = () => {
    persistWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, removeFromWishlist, isInWishlist, clearWishlist, isLoading }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
