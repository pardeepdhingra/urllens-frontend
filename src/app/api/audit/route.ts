// ============================================================================
// URL Lens - Audit API Route
// POST /api/audit
// Audits URLs for scrapeability and discovers URLs from domains
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type {
  AuditRequest,
  AuditResponse,
  AuditMode,
  AUDIT_LIMITS as AuditLimitsType,
} from '@/types/audit';

// ============================================================================
// Feature Flag Check
// ============================================================================

const isFeatureEnabled = process.env.UNDER_DEV === 'true';

// ============================================================================
// Rate Limiting
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // audits per minute
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
// Validation
// ============================================================================

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateRequest(body: unknown): { valid: boolean; error?: string; request?: AuditRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = body as Record<string, unknown>;

  // Check mode
  if (!req.mode || (req.mode !== 'batch' && req.mode !== 'domain')) {
    return { valid: false, error: 'Mode must be "batch" or "domain"' };
  }

  const mode = req.mode as AuditMode;

  // Validate based on mode
  if (mode === 'batch') {
    if (!Array.isArray(req.urls) || req.urls.length === 0) {
      return { valid: false, error: 'URLs array is required for batch mode' };
    }

    // Import limits dynamically to avoid issues
    const MAX_URLS = 100;
    if (req.urls.length > MAX_URLS) {
      return { valid: false, error: `Maximum ${MAX_URLS} URLs allowed per batch` };
    }

    // Validate each URL
    const invalidUrls = req.urls.filter((url: unknown) => typeof url !== 'string' || !isValidUrl(url as string));
    if (invalidUrls.length > 0) {
      return { valid: false, error: `Invalid URLs found: ${invalidUrls.slice(0, 3).join(', ')}${invalidUrls.length > 3 ? '...' : ''}` };
    }

    return {
      valid: true,
      request: {
        mode: 'batch',
        urls: req.urls as string[],
      },
    };
  }

  // Domain mode
  if (!req.domain || typeof req.domain !== 'string') {
    return { valid: false, error: 'Domain is required for domain mode' };
  }

  // Basic domain validation
  const domain = req.domain.trim().toLowerCase();
  const domainRegex = /^[a-z0-9][-a-z0-9]*(\.[a-z0-9][-a-z0-9]*)+$/;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!domainRegex.test(cleanDomain)) {
    return { valid: false, error: 'Invalid domain format' };
  }

  return {
    valid: true,
    request: {
      mode: 'domain',
      domain: cleanDomain,
    },
  };
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<AuditResponse>> {
  try {
    // 1. Check feature flag
    if (!isFeatureEnabled) {
      return NextResponse.json(
        { success: false, error: 'This feature is not yet available' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 3. Validate request
    const validation = validateRequest(body);
    if (!validation.valid || !validation.request) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const auditRequest = validation.request;

    // 4. Dynamic imports
    let createServerSupabaseClient;
    let processURLBatch;
    let generateAuditSummary;
    let validateURLs;
    let discoverDomainURLs;
    let AUDIT_LIMITS: typeof AuditLimitsType;

    try {
      const supabaseModule = await import('@/lib/supabase/server');
      createServerSupabaseClient = supabaseModule.createServerSupabaseClient;

      const auditModule = await import('@/lib/auditEngine');
      processURLBatch = auditModule.processURLBatch;
      generateAuditSummary = auditModule.generateAuditSummary;
      validateURLs = auditModule.validateURLs;

      const discoveryModule = await import('@/lib/domainDiscoveryEngine');
      discoverDomainURLs = discoveryModule.discoverDomainURLs;

      const typesModule = await import('@/types/audit');
      AUDIT_LIMITS = typesModule.AUDIT_LIMITS;
    } catch (importError) {
      console.error('Module import error:', importError);
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 5. Authenticate user (required for audit)
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

    // 6. Check rate limit
    const { allowed, remaining } = checkRateLimit(user.id);

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

    // 7. Get URLs to audit
    let urlsToAudit: string[] = [];
    let discovery = undefined;

    if (auditRequest.mode === 'domain' && auditRequest.domain) {
      // Domain discovery mode
      discovery = await discoverDomainURLs(auditRequest.domain, {
        maxUrls: AUDIT_LIMITS.maxUrlsPerDomain,
        timeoutMs: AUDIT_LIMITS.timeoutMs,
      });

      urlsToAudit = discovery.discoveredUrls.map(u => u.url);
    } else if (auditRequest.urls) {
      // Batch mode
      const { valid } = validateURLs(auditRequest.urls);
      urlsToAudit = valid;
    }

    if (urlsToAudit.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs to audit' },
        { status: 400 }
      );
    }

    // 8. Create audit session in database
    let sessionId: string;
    try {
      const { data: session, error: sessionError } = await supabase
        .from('url_audit_sessions')
        .insert({
          user_id: user.id,
          mode: auditRequest.mode,
          domain: auditRequest.domain || null,
          total_urls: urlsToAudit.length,
          completed_urls: 0,
          status: 'testing',
        })
        .select('id')
        .single();

      if (sessionError || !session) {
        console.error('Session creation error:', sessionError);
        throw new Error('Failed to create audit session');
      }

      sessionId = session.id;
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create audit session' },
        { status: 500 }
      );
    }

    // 9. Run the audit
    const results = await processURLBatch(urlsToAudit, {
      concurrency: AUDIT_LIMITS.concurrency,
      timeoutMs: AUDIT_LIMITS.timeoutMs,
    });

    // 10. Save results to database
    try {
      const dbResults = results.map(result => ({
        session_id: sessionId,
        user_id: user.id,
        url: result.url,
        status_code: result.status,
        final_url: result.finalUrl,
        scrape_score: result.scrapeLikelihoodScore,
        requires_js: result.jsRequired,
        bot_protections: result.botProtections,
        redirects: result.redirects,
        accessible: result.accessible,
        recommendation: result.recommendation,
        blocked_reason: result.blockedReason || null,
        content_type: result.contentType || null,
        response_time_ms: result.responseTimeMs || null,
      }));

      await supabase.from('url_audit_results').insert(dbResults);

      // Update session status
      await supabase
        .from('url_audit_sessions')
        .update({
          status: 'completed',
          completed_urls: results.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (dbError) {
      console.error('Failed to save audit results:', dbError);
      // Continue - we'll still return results to user
    }

    // 11. Generate summary
    const summary = generateAuditSummary(results);

    // 12. Return response
    return NextResponse.json(
      {
        success: true,
        sessionId,
        results,
        discovery,
        summary,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Audit API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
