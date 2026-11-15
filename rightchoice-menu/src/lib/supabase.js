import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anon);

// Only the PUBLIC anon key is used here. All protection comes from
// Row Level Security policies in supabase/schema.sql.
export const supabase = isConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const BUCKET = 'menu-images';

export function imageUrl(path) {
  if (!path || !supabase) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const formatPrice = (n) => {
  const v = Number(n);
  return '₹' + (Number.isInteger(v) ? v : v.toFixed(2));
};
