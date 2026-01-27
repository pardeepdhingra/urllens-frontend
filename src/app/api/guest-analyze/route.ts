// ============================================================================
// URL Lens - Guest Analyze API Route
// POST /api/guest-analyze
// Allows unauthenticated users to analyze URLs (for MCP server)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeUrl, normalizeUrl } from '@/lib/urlAnalyzer';
import { calculateScore } from '@/lib/scoringEngine';
import { nanoid } from 'nanoid';

// Create a service role client for guest access (bypasses RLS)
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Simple rate limiting for guests (in-memory, resets on server restart)
const guestRateLimit = new Map<string, { count: number; resetAt: number }>();
const GUEST_RATE_LIMIT = 10; // requests per hour
const GUEST_RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkGuestRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = guestRateLimit.get(ip);

  if (!record || now > record.resetAt) {
    guestRateLimit.set(ip, { count: 1, resetAt: now + GUEST_RATE_WINDOW });
    return { allowed: true, remaining: GUEST_RATE_LIMIT - 1 };
  }

  if (record.count >= GUEST_RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: GUEST_RATE_LIMIT - record.count };
}

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

interface GuestAnalyzeRequest {
  url: string;
}

interface GuestAnalyzeResponse {
  success: boolean;
  data?: {
    url: string;
    final_url: string;
    score: number;
    recommendation: string;
    share_url: string;
    share_id: string;
    status_code: number;
    response_time_ms: number;
    redirect_count: number;
    redirects: Array<{ from: string; to: string; status: number }>;
    js_required: boolean;
    bot_protections: Array<{ type: string; confidence: string; details?: string }>;
    utm_analysis?: {
      hasUtmParams: boolean;
      utmPreserved: boolean;
      paramsRemoved: string[];
      paramsModified: string[];
    };
    analyzed_at: string;
  };
  error?: string;
}

/**
 * POST /api/guest-analyze
 * Analyzes a URL without requiring authentication
 * Visual analysis is NOT available for guests
 */
export async function POST(request: NextRequest): Promise<NextResponse<GuestAnalyzeResponse>> {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    const { allowed, remaining } = checkGuestRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later or sign up for unlimited access.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': GUEST_RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // Parse request body
    let body: GuestAnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(body.url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Analyze the URL
    const analysisResult = await analyzeUrl(body.url);

    // Calculate score
    const { score, recommendation } = calculateScore(analysisResult);

    // Generate share ID
    const shareId = nanoid(12);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareId}`;

    // Prepare data for storage
    const analysisData = {
      user_id: null, // Guest user - no user ID
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
      visual_analysis: null, // Not available for guests
      share_id: shareId,
      score,
      recommendation,
      analyzed_at: new Date().toISOString(),
      is_guest: true, // Mark as guest analysis
    };

    // Save to database using service role client
    try {
      const supabase = createServiceClient();
      const { error: saveError } = await supabase
        .from('url_analyses')
        .insert(analysisData);

      if (saveError) {
        console.error('Error saving guest analysis:', saveError);
        // Continue even if save fails - return the analysis result
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if save fails
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          url: analysisResult.url,
          final_url: analysisResult.finalUrl,
          score,
          recommendation,
          share_url: shareUrl,
          share_id: shareId,
          status_code: analysisResult.status,
          response_time_ms: analysisResult.responseTimeMs,
          redirect_count: analysisResult.redirects.length,
          redirects: analysisResult.redirects,
          js_required: analysisResult.jsHints,
          bot_protections: analysisResult.botProtections,
          utm_analysis: analysisResult.utmAnalysis ? {
            hasUtmParams: analysisResult.utmAnalysis.hasUtmParams,
            utmPreserved: analysisResult.utmAnalysis.utmPreserved,
            paramsRemoved: analysisResult.utmAnalysis.paramsRemoved,
            paramsModified: analysisResult.utmAnalysis.paramsModified,
          } : undefined,
          analyzed_at: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': GUEST_RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        }
      }
    );
  } catch (error) {
    console.error('Guest analyze API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
