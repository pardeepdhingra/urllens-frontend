// ============================================================================
// URL Lens - History API Route
// GET /api/history
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { HistoryResponse } from '@/types';

// Configuration
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/history
 * Retrieves user's URL analysis history
 */
export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(
      Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(offsetParam || '0', 10) || 0);

    // 3. Query database
    const { data, error: queryError } = await supabase
      .from('url_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error('History query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    // 4. Return success response
    return NextResponse.json(
      { success: true, data: data || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('History API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
