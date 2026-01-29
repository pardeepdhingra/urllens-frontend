// ============================================================================
// URL Lens - Audit History API Route
// GET /api/audit/history - Get user's audit sessions
// GET /api/audit/history/[id] - Get specific audit session with results
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

interface AuditSessionSummary {
  id: string;
  mode: 'batch' | 'domain';
  domain: string | null;
  totalUrls: number;
  completedUrls: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  avgScore?: number;
  bestScore?: number;
}

interface AuditHistoryResponse {
  success: boolean;
  sessions?: AuditSessionSummary[];
  error?: string;
}

// ============================================================================
// GET Handler - List audit sessions
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<AuditHistoryResponse>> {
  try {
    // 1. Check feature flag
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { success: false, error: 'This feature is not yet available' },
        { status: 403 }
      );
    }

    // 2. Dynamic imports
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

    // 3. Authenticate user
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

    // 4. Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 5. Fetch audit sessions with aggregated stats
    const { data: sessions, error: sessionsError } = await supabase
      .from('url_audit_sessions')
      .select(`
        id,
        mode,
        domain,
        total_urls,
        completed_urls,
        status,
        created_at,
        completed_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionsError) {
      console.error('Error fetching audit sessions:', sessionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit history' },
        { status: 500 }
      );
    }

    // 6. Get aggregated scores for each session
    const sessionIds = sessions?.map(s => s.id) || [];
    const scoreMap: Record<string, { avgScore: number; bestScore: number }> = {};

    if (sessionIds.length > 0) {
      const { data: scoreData } = await supabase
        .from('url_audit_results')
        .select('session_id, scrape_score')
        .in('session_id', sessionIds);

      if (scoreData) {
        // Calculate avg and best score per session
        const grouped: Record<string, number[]> = {};
        for (const row of scoreData) {
          if (!grouped[row.session_id]) {
            grouped[row.session_id] = [];
          }
          if (row.scrape_score !== null) {
            grouped[row.session_id].push(row.scrape_score);
          }
        }

        for (const [sessionId, scores] of Object.entries(grouped)) {
          if (scores.length > 0) {
            scoreMap[sessionId] = {
              avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
              bestScore: Math.max(...scores),
            };
          }
        }
      }
    }

    // 7. Format response
    const formattedSessions: AuditSessionSummary[] = (sessions || []).map(session => ({
      id: session.id,
      mode: session.mode,
      domain: session.domain,
      totalUrls: session.total_urls,
      completedUrls: session.completed_urls,
      status: session.status,
      createdAt: session.created_at,
      completedAt: session.completed_at,
      avgScore: scoreMap[session.id]?.avgScore,
      bestScore: scoreMap[session.id]?.bestScore,
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Audit history API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
