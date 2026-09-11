import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyChvcQmEyHCZ0GT5LUHURYHXs8g26doY2I",
  authDomain: "kintesi-next-79628.firebaseapp.com",
  projectId: "kintesi-next-79628",
  storageBucket: "kintesi-next-79628.firebasestorage.app",
  messagingSenderId: "564773259361",
  appId: "1:564773259361:web:ed05ea6b5475c0f7eb8220",
  measurementId: "G-09B0JPTRBQ"
};

// Initialize Firebase (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Services with Permanent Local Persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase setPersistence notice:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db = getFirestore(app);
export const storage = getStorage(app);

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'manage.kintesi@gmail.com';

// Built-in Authorized Team Admins
export const DEFAULT_AUTHORIZED_ADMINS = [
  'manage.kintesi@gmail.com',
  'admin@kintesi.com',
  ADMIN_EMAIL,
];

export const isAdminUser = (email?: string | null): boolean => {
  if (!email) return false;
  const target = email.toLowerCase().trim();
  if (DEFAULT_AUTHORIZED_ADMINS.map(e => e.toLowerCase().trim()).includes(target)) {
    return true;
  }
  try {
    const saved = localStorage.getItem('kintesi_authorized_admins');
    if (saved) {
      const list: string[] = JSON.parse(saved);
      if (list.map(e => e.toLowerCase().trim()).includes(target)) {
        return true;
      }
    }
  } catch {}
  return false;
};
