// ============================================================================
// URL Lens - Supabase Browser Client
// ============================================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser/client-side usage.
 * Uses cookies for session management.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client-side usage
let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Gets the singleton Supabase browser client.
 * Creates a new instance if one doesn't exist.
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called in the browser');
  }

  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}
