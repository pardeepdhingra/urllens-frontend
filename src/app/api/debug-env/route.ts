// ============================================================================
// URL Lens - Environment Debug Route (REMOVE IN PRODUCTION)
// GET /api/debug-env
// ============================================================================

import { NextResponse } from 'next/server';

/**
 * GET /api/debug-env
 * Returns sanitized environment variable status for debugging
 * NOTE: Remove this endpoint after debugging is complete
 */
export async function GET() {
  // Only allow in non-production or with a secret query param
  const isVercel = process.env.VERCEL === '1';
  const nodeEnv = process.env.NODE_ENV;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: nodeEnv,
      VERCEL: isVercel ? 'yes' : 'no',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    },
    visualAnalysis: {
      DISABLE_VISUAL_ANALYSIS: {
        raw: process.env.DISABLE_VISUAL_ANALYSIS ?? 'NOT SET',
        normalized: process.env.DISABLE_VISUAL_ANALYSIS?.toLowerCase().trim() ?? 'NOT SET',
        isDisabledComputed:
          process.env.DISABLE_VISUAL_ANALYSIS?.toLowerCase().trim() === 'true' ||
          process.env.DISABLE_VISUAL_ANALYSIS?.toLowerCase().trim() === '1',
      },
      BROWSERLESS_API_KEY: {
        isSet: !!process.env.BROWSERLESS_API_KEY,
        length: process.env.BROWSERLESS_API_KEY?.length ?? 0,
        prefix: process.env.BROWSERLESS_API_KEY?.substring(0, 8) ?? 'N/A',
        hasWhitespace: process.env.BROWSERLESS_API_KEY !== process.env.BROWSERLESS_API_KEY?.trim(),
      },
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: {
        isSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET (hidden)' : 'NOT SET',
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        isSet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        isSet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
      },
    },
    app: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    },
  });
}
