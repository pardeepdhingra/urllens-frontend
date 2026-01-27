// ============================================================================
// URL Lens - Share Report API Route
// POST /api/share - Create shareable link
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

interface ShareRequest {
  analysis_id: string;
}

interface ShareResponse {
  success: boolean;
  share_id?: string;
  share_url?: string;
  error?: string;
}

/**
 * Get the base URL from request headers
 * Works in any environment (localhost, Vercel, custom domain)
 */
function getBaseUrl(request: NextRequest): string {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback to request headers (works on Vercel and other platforms)
  const host = request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'https');

  return `${protocol}://${host}`;
}

/**
 * POST /api/share
 * Creates a shareable link for an analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse<ShareResponse>> {
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

    // 2. Parse request body
    let body: ShareRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body.analysis_id) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // 3. Verify the analysis belongs to the user
    console.log('Looking for analysis:', body.analysis_id, 'for user:', user.id);

    const { data: analysis, error: fetchError } = await supabase
      .from('url_analyses')
      .select('id, share_id, user_id')
      .eq('id', body.analysis_id)
      .eq('user_id', user.id)
      .single();

    console.log('Fetch result:', { analysis, fetchError });

    if (fetchError || !analysis) {
      // Try to fetch without user_id filter to debug
      const { data: anyAnalysis } = await supabase
        .from('url_analyses')
        .select('id, user_id')
        .eq('id', body.analysis_id)
        .single();
      console.log('Analysis without user filter:', anyAnalysis);

      return NextResponse.json(
        { success: false, error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // 4. If already has share_id, return it
    if (analysis.share_id) {
      const baseUrl = getBaseUrl(request);
      return NextResponse.json({
        success: true,
        share_id: analysis.share_id,
        share_url: `${baseUrl}/share/${analysis.share_id}`,
      });
    }

    // 5. Generate new share_id
    const shareId = nanoid(12);

    // 6. Update analysis with share_id
    const { data: updateData, error: updateError } = await supabase
      .from('url_analyses')
      .update({ share_id: shareId })
      .eq('id', body.analysis_id)
      .eq('user_id', user.id)
      .select('id, share_id')
      .single();

    if (updateError) {
      console.error('Error creating share link:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    if (!updateData || updateData.share_id !== shareId) {
      console.error('Share ID was not saved. updateData:', updateData);
      return NextResponse.json(
        { success: false, error: 'Failed to save share link' },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(request);
    return NextResponse.json({
      success: true,
      share_id: shareId,
      share_url: `${baseUrl}/share/${shareId}`,
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
