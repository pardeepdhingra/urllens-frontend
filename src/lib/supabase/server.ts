// ============================================================================
// URL Lens - Supabase Server Client
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side usage (API routes, Server Components).
 * Handles cookie-based session management.
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    console.error('Error getting cookies:', error);
    // Return a client without cookie handling for cases where cookies aren't available
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op
        },
      },
    });
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Gets the current authenticated user from the server.
 * Returns null if not authenticated.
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Requires authentication on the server.
 * Throws an error if the user is not authenticated.
 */
export async function requireServerAuth() {
  const user = await getServerUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
