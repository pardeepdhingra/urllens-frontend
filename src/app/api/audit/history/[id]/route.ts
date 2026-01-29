// ============================================================================
// URL Lens - Audit Session Detail API Route
// GET /api/audit/history/[id] - Get specific audit session with all results
// DELETE /api/audit/history/[id] - Delete an audit session
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Feature Flag Check
// ============================================================================

function isFeatureEnabled(): boolean {
  return process.env.UNDER_DEV === 'true';
}

// ============================================================================
// Types
// ============================================================================

interface AuditSessionDetail {
  id: string;
  mode: 'batch' | 'domain';
  domain: string | null;
  totalUrls: number;
  completedUrls: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  results: AuditResult[];
  summary: {
    avgScore: number;
    bestScore: number;
    accessibleCount: number;
    blockedCount: number;
    jsRequiredCount: number;
  };
}

interface AuditResult {
  id: string;
  url: string;
  statusCode: number | null;
  finalUrl: string | null;
  scrapeScore: number | null;
  requiresJs: boolean;
  botProtections: string[];
  accessible: boolean;
  recommendation: string | null;
  blockedReason: string | null;
  contentType: string | null;
  responseTimeMs: number | null;
}

interface SessionDetailResponse {
  success: boolean;
  session?: AuditSessionDetail;
  error?: string;
}

// ============================================================================
// GET Handler - Get session details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SessionDetailResponse>> {
  try {
    const { id } = await params;

    // 1. Check feature flag
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { success: false, error: 'This feature is not yet available' },
        { status: 403 }
      );
    }

    // 2. Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // 3. Dynamic imports
    let createServerSupabaseClient;
    try {
      const supabaseModule = await import('@/lib/supabase/server');
      createServerSupabaseClient = supabaseModule.createServerSupabaseClient;
    } catch (importError) {
      console.error('Module import error:', importError);
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 4. Authenticate user
    let user;
    let supabase;
    try {
      supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      user = data.user;
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // 5. Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('url_audit_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Audit session not found' },
        { status: 404 }
      );
    }

    // 6. Fetch results
    const { data: results, error: resultsError } = await supabase
      .from('url_audit_results')
      .select('*')
      .eq('session_id', id)
      .order('scrape_score', { ascending: false });

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit results' },
        { status: 500 }
      );
    }

    // 7. Calculate summary
    const scores = (results || []).map(r => r.scrape_score).filter(s => s !== null) as number[];
    const summary = {
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      accessibleCount: (results || []).filter(r => r.accessible).length,
      blockedCount: (results || []).filter(r => !r.accessible).length,
      jsRequiredCount: (results || []).filter(r => r.requires_js).length,
    };

    // 8. Format response
    const formattedSession: AuditSessionDetail = {
      id: session.id,
      mode: session.mode,
      domain: session.domain,
      totalUrls: session.total_urls,
      completedUrls: session.completed_urls,
      status: session.status,
      createdAt: session.created_at,
      completedAt: session.completed_at,
      results: (results || []).map(r => ({
        id: r.id,
        url: r.url,
        statusCode: r.status_code,
        finalUrl: r.final_url,
        scrapeScore: r.scrape_score,
        requiresJs: r.requires_js,
        botProtections: r.bot_protections || [],
        accessible: r.accessible,
        recommendation: r.recommendation,
        blockedReason: r.blocked_reason,
        contentType: r.content_type,
        responseTimeMs: r.response_time_ms,
      })),
      summary,
    };

    return NextResponse.json({
      success: true,
      session: formattedSession,
    });
  } catch (error) {
    console.error('Audit session detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE Handler - Delete session
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const { id } = await params;

    // 1. Check feature flag
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { success: false, error: 'This feature is not yet available' },
        { status: 403 }
      );
    }

    // 2. Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // 3. Dynamic imports
    let createServerSupabaseClient;
    try {
      const supabaseModule = await import('@/lib/supabase/server');
      createServerSupabaseClient = supabaseModule.createServerSupabaseClient;
    } catch (importError) {
      console.error('Module import error:', importError);
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 4. Authenticate user
    let user;
    let supabase;
    try {
      supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      user = data.user;
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // 5. Delete session (cascades to results)
    const { error: deleteError } = await supabase
      .from('url_audit_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete audit session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit session delete API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
