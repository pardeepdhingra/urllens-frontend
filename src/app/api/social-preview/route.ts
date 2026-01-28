// ============================================================================
// URL Lens - Social Preview API Route
// POST /api/social-preview
// Analyzes a URL and returns social media preview data
// ============================================================================

// Force Node.js runtime for JSDOM compatibility
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { analyzeSocialPreview, SocialPreviewResult } from '@/lib/socialPreviewAnalyzer';

// ============================================================================
// Types
// ============================================================================

interface SocialPreviewRequest {
  url: string;
}

interface SocialPreviewResponse {
  success: boolean;
  preview?: SocialPreviewResult;
  error?: string;
}

// ============================================================================
// Rate Limiting
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// ============================================================================
// URL Validation
// ============================================================================

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<SocialPreviewResponse>> {
  try {
    // 1. Authenticate user (optional - allow guest access)
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Use user ID or IP for rate limiting
    const rateLimitKey = user?.id ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'anonymous';

    // 2. Check rate limit
    const { allowed, remaining } = checkRateLimit(rateLimitKey);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 3. Parse request body
    let body: SocialPreviewRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 4. Validate URL
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

    // 5. Analyze social preview
    const preview = await analyzeSocialPreview(body.url);

    // 6. Optionally save to database for authenticated users
    if (user) {
      try {
        await supabase.from('url_social_preview').insert({
          user_id: user.id,
          url: preview.url,
          metadata: preview.metadata,
          platform_preview: preview.platforms,
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        // Log but don't fail the request
        console.error('Failed to save social preview:', dbError);
      }
    }

    // 7. Return success response
    return NextResponse.json(
      { success: true, preview },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Social preview API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('HTTP 403') || error.message.includes('HTTP 401')) {
        return NextResponse.json(
          { success: false, error: 'Unable to access the page. It may be behind authentication.' },
          { status: 422 }
        );
      }

      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out. The page took too long to respond.' },
          { status: 504 }
        );
      }

      if (error.message.includes('not HTML')) {
        return NextResponse.json(
          { success: false, error: 'The URL does not return an HTML page.' },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
