import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DEFAULT_SUPABASE_URL = 'https://jhewkxwfujkigvbmybry.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdreHdmdWpraWd2Ym15YnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjAyMDYsImV4cCI6MjEwNDQ5NjIwNn0.kDSjx7F7tYhDwbL-LbYANEEuDiQuclKnFp5mwJc6Y0A';

const supabaseUrl = rawUrl || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = rawKey || DEFAULT_SUPABASE_ANON_KEY;

export const isDatabaseConnected = Boolean(
  (rawUrl || DEFAULT_SUPABASE_URL) &&
  !supabaseUrl.includes('unconnected-project') &&
  !supabaseUrl.includes('placeholder')
);

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
