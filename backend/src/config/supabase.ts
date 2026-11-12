import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    const mensaje =
      '[CONFIG] Las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY no estan configuradas. ' +
      'Definalas en su archivo .env o en el panel de Vercel.';

    if (env.isProduction) {
      throw new Error(mensaje);
    }

    console.warn(mensaje);
  }

  supabaseClient = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

export const supabase = getSupabase();
