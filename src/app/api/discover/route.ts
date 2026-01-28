// ============================================================================
// URL Lens - Discover API Route
// POST /api/discover
// Discovers URLs from a domain using sitemaps, robots.txt, and common paths
// This is a SEPARATE endpoint from /api/audit for future extensibility
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type {
  DomainDiscoveryResult,
  AUDIT_LIMITS as AuditLimitsType,
} from '@/types/audit';

// ============================================================================
// Feature Flag Check
// ============================================================================

function isFeatureEnabled(): boolean {
  return process.env.UNDER_DEV === 'true';
}

// ============================================================================
// Rate Limiting
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // discoveries per minute
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
// Types
// ============================================================================

interface DiscoverRequest {
  domain: string;
  maxUrls?: number;
  includeCommonPaths?: boolean;
}

interface DiscoverResponse {
  success: boolean;
  discovery?: DomainDiscoveryResult;
  error?: string;
}

// ============================================================================
// Validation
// ============================================================================

function validateRequest(body: unknown): { valid: boolean; error?: string; request?: DiscoverRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = body as Record<string, unknown>;

  // Domain is required
  if (!req.domain || typeof req.domain !== 'string') {
    return { valid: false, error: 'Domain is required' };
  }

  // Basic domain validation
  const domain = req.domain.trim().toLowerCase();
  const domainRegex = /^[a-z0-9][-a-z0-9]*(\.[a-z0-9][-a-z0-9]*)+$/;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!domainRegex.test(cleanDomain)) {
    return { valid: false, error: 'Invalid domain format' };
  }

  // Validate maxUrls if provided
  let maxUrls: number | undefined;
  if (req.maxUrls !== undefined) {
    if (typeof req.maxUrls !== 'number' || req.maxUrls < 1 || req.maxUrls > 500) {
      return { valid: false, error: 'maxUrls must be a number between 1 and 500' };
    }
    maxUrls = req.maxUrls;
  }

  // Validate includeCommonPaths if provided
  let includeCommonPaths: boolean | undefined;
  if (req.includeCommonPaths !== undefined) {
    if (typeof req.includeCommonPaths !== 'boolean') {
      return { valid: false, error: 'includeCommonPaths must be a boolean' };
    }
    includeCommonPaths = req.includeCommonPaths;
  }

  return {
    valid: true,
    request: {
      domain: cleanDomain,
      maxUrls,
      includeCommonPaths,
    },
  };
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<DiscoverResponse>> {
  try {
    // 1. Check feature flag
    if (!isFeatureEnabled()) {
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

    const discoverRequest = validation.request;

    // 4. Dynamic imports
    let createServerSupabaseClient;
    let discoverDomainURLs;
    let AUDIT_LIMITS: typeof AuditLimitsType;

    try {
      const supabaseModule = await import('@/lib/supabase/server');
      createServerSupabaseClient = supabaseModule.createServerSupabaseClient;

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

    // 5. Authenticate user (required for discovery)
    let user;
    try {
      const supabase = await createServerSupabaseClient();
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

    // 7. Run discovery
    const discovery = await discoverDomainURLs(discoverRequest.domain, {
      maxUrls: discoverRequest.maxUrls ?? AUDIT_LIMITS.maxUrlsPerDomain,
      timeoutMs: AUDIT_LIMITS.timeoutMs,
      includeCommonPaths: discoverRequest.includeCommonPaths ?? true,
    });

    // 8. Return response
    return NextResponse.json(
      {
        success: true,
        discovery,
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
    console.error('Discover API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
