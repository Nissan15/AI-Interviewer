import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  ''
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-supabase')
  );
};

// Fallback placeholder client to prevent runtime crash during initial setup
const effectiveUrl = isSupabaseConfigured()
  ? supabaseUrl
  : 'https://placeholder-project.supabase.co';

const effectiveKey = isSupabaseConfigured()
  ? supabaseAnonKey
  : 'placeholder-anon-key';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  effectiveUrl,
  effectiveKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ai-mock-interviewer-auth-token',
    },
  }
);
