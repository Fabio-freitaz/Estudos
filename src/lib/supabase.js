import { createClient } from '@supabase/supabase-js';

const getEnvValue = (...names) => {
  for (const name of names) {
    const value = import.meta.env[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const isPlaceholderValue = (value) => typeof value === 'string' && /(^your-|placeholder|example|changeme|replace-me|replace me|insert)/i.test(value.trim());

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL', 'SUPABASE_URL');
const supabaseAnonKey = getEnvValue(
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
);

export const supabase = supabaseUrl && supabaseAnonKey && !isPlaceholderValue(supabaseUrl) && !isPlaceholderValue(supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = Boolean(supabase);

export const getSupabaseSession = async () => {
  if (!supabase) {
    return { data: { session: null }, error: null };
  }

  return supabase.auth.getSession();
};

export const getProfileFromSession = async (session) => {
  if (!supabase || !session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
};
