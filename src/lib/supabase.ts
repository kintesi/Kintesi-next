import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDatabaseConnected = Boolean(rawUrl && rawKey && !rawUrl.includes('placeholder'));

const supabaseUrl = rawUrl || 'https://unconnected-project.supabase.co';
const supabaseAnonKey = rawKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_key';

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'manage.kintesi@gmail.com';

// Built-in Authorized Team Admins (Client Store Owner)
export const DEFAULT_AUTHORIZED_ADMINS = [
  'manage.kintesi@gmail.com',
  'admin@kintesi.com',
  ADMIN_EMAIL,
];

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isAdminUser = (email?: string | null): boolean => {
  if (!email) return false;
  const target = email.toLowerCase().trim();
  
  // 1. Check default list
  if (DEFAULT_AUTHORIZED_ADMINS.map(e => e.toLowerCase().trim()).includes(target)) {
    return true;
  }

  // 2. Check local storage authorized list
  try {
    const localAdmins: string[] = JSON.parse(localStorage.getItem('kintesi_authorized_admins') || '[]');
    if (localAdmins.map(e => e.toLowerCase().trim()).includes(target)) {
      return true;
    }
  } catch {}

  // 3. Check store settings local cache
  try {
    const storeSettings = JSON.parse(localStorage.getItem('kintesi_store_settings') || '{}');
    if (storeSettings.authorizedAdmins && Array.isArray(storeSettings.authorizedAdmins)) {
      if (storeSettings.authorizedAdmins.map((e: string) => e.toLowerCase().trim()).includes(target)) {
        return true;
      }
    }
  } catch {}

  return false;
};
