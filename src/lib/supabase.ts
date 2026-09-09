import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gcoxccaaayevlrpshykx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb3hjY2FhYXlldmxycHNoeWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjQ3OTksImV4cCI6MjEwMzM0MDc5OX0.AwjuiYTyJsaNiLJgxqpa_Nl7V6lr3g9madOz5V5FjQQ';

export const ADMIN_EMAIL = 'tamim.hasan2005@gmail.com';

// Built-in Authorized Team Admins
export const DEFAULT_AUTHORIZED_ADMINS = [
  'tamim.hasan2005@gmail.com',
  'tamim.dev05@gmail.com',
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
    const localAdmins: string[] = JSON.parse(localStorage.getItem('cartfly_authorized_admins') || '[]');
    if (localAdmins.map(e => e.toLowerCase().trim()).includes(target)) {
      return true;
    }
  } catch {}

  // 3. Check store settings local cache
  try {
    const storeSettings = JSON.parse(localStorage.getItem('cartfly_store_settings') || '{}');
    if (storeSettings.authorizedAdmins && Array.isArray(storeSettings.authorizedAdmins)) {
      if (storeSettings.authorizedAdmins.map((e: string) => e.toLowerCase().trim()).includes(target)) {
        return true;
      }
    }
  } catch {}

  return false;
};
