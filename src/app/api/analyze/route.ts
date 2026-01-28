// ============================================================================
// URL Lens - Analyze API Route
// POST /api/analyze
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { analyzeUrl, normalizeUrl } from '@/lib/urlAnalyzer';
import { analyzeUrlVisually } from '@/lib/screenshotAnalyzer';
import { analyzeSEO } from '@/lib/seoAnalyzer';
import { calculateScore } from '@/lib/scoringEngine';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rateLimit';
import type { AnalyzeRequest, AnalyzeResponse, URLAnalysis } from '@/types';

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    normalizeUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/analyze
 * Analyzes a URL for scrapability
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
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

    // 2. Check rate limit
    const { allowed, info } = checkRateLimit(user.id);
    const rateLimitHeaders = getRateLimitHeaders(info);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${Math.ceil((info.reset - Date.now()) / 1000)} seconds.`,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    // 3. Parse and validate request body
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (!isValidUrl(body.url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // 4. Analyze the URL (include HTML if SEO analysis is requested)
    const seoAnalysisRequested = (body as { seoAnalysis?: boolean }).seoAnalysis === true;
    const analysisResult = await analyzeUrl(body.url, { includeHtml: seoAnalysisRequested });

    // 4.5 Run visual analysis if requested
    let visualAnalysisResult = null;
    if (body.visualAnalysis === true) {
      try {
        console.log('Starting visual analysis for:', body.url);
        visualAnalysisResult = await analyzeUrlVisually(body.url);
        console.log('Visual analysis complete:', {
          screenshotCount: visualAnalysisResult.screenshots.length,
          blocked: visualAnalysisResult.blocked,
          duration: visualAnalysisResult.analysis_duration_ms,
          firstScreenshotSize: visualAnalysisResult.screenshots[0]?.screenshot_base64?.length || 0,
        });
      } catch (visualError) {
        console.error('Visual analysis error:', visualError);
        // Visual analysis is optional - continue without it
      }
    }

    // 4.6 Run SEO/AEO/GEO/LLMO analysis if requested
    let seoAnalysisResult = null;
    if (seoAnalysisRequested && analysisResult.html) {
      try {
        console.log('Starting SEO analysis for:', body.url);
        seoAnalysisResult = await analyzeSEO(
          analysisResult.finalUrl,
          analysisResult.html,
          analysisResult.responseTimeMs
        );
        console.log('SEO analysis complete:', {
          seoScore: seoAnalysisResult.seo.score,
          aeoScore: seoAnalysisResult.aeo.score,
          geoScore: seoAnalysisResult.geo.score,
          llmoScore: seoAnalysisResult.llmo.score,
          recommendations: seoAnalysisResult.recommendations.length,
          duration: seoAnalysisResult.analysisDurationMs,
        });
      } catch (seoError) {
        console.error('SEO analysis error:', seoError);
        // SEO analysis is optional - continue without it
      }
    }

    // 5. Calculate score
    const { score, recommendation } = calculateScore(analysisResult);

    // 6. Prepare data for storage (matching database schema)
    const analysisData = {
      user_id: user.id,
      url: analysisResult.url,
      final_url: analysisResult.finalUrl,
      status_code: analysisResult.status,
      redirect_count: analysisResult.redirects.length,
      redirects: analysisResult.redirects,
      response_time_ms: analysisResult.responseTimeMs,
      content_type: analysisResult.contentType,
      js_required: analysisResult.jsHints,
      bot_protections: analysisResult.botProtections,
      headers: analysisResult.headers,
      robots_txt: analysisResult.robotsTxt,
      rate_limit_info: analysisResult.rateLimitInfo,
      utm_analysis: analysisResult.utmAnalysis,
      visual_analysis: visualAnalysisResult,
      seo_analysis: seoAnalysisResult,
      score,
      recommendation,
      analyzed_at: new Date().toISOString(),
    };

    // 7. Save to database
    const { data: savedData, error: saveError } = await supabase
      .from('url_analyses')
      .insert(analysisData)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      console.error('Save error details:', JSON.stringify(saveError, null, 2));
      console.error('Data being saved:', JSON.stringify(analysisData, null, 2).substring(0, 1000));
      // Return the analysis even if saving fails, but mark as not saved
      // This prevents share functionality from trying to share unsaved analysis
      return NextResponse.json(
        {
          success: true,
          saved: false,
          saveError: saveError.message || 'Unknown database error',
          data: {
            ...analysisData,
            id: '', // Empty ID since not saved to database
            created_at: new Date().toISOString(),
          } as URLAnalysis,
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    // 8. Return success response
    return NextResponse.json(
      { success: true, saved: true, data: savedData as URLAnalysis },
      { status: 200, headers: rateLimitHeaders }
    );
  } catch (error) {
    console.error('Analyze API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
