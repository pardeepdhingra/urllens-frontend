// ============================================================================
// URL Lens - Audit Engine
// Core audit orchestration and URL testing
// ============================================================================

import {
  URLAuditResult,
  AuditRedirect,
  ScoreBreakdown,
  AuditRecommendation,
  AuditProgress,
  AuditStatus,
  AUDIT_LIMITS,
} from '@/types/audit';

// ============================================================================
// Bot Protection Patterns
// ============================================================================

const BOT_PROTECTION_PATTERNS = [
  { name: 'Cloudflare', patterns: ['cf-ray', 'cloudflare', '__cf_bm'] },
  { name: 'Akamai', patterns: ['akamai', '_abck', 'ak_bmsc'] },
  { name: 'PerimeterX', patterns: ['_px', 'perimeterx'] },
  { name: 'DataDome', patterns: ['datadome'] },
  { name: 'Imperva', patterns: ['incap_ses', 'visid_incap'] },
  { name: 'reCAPTCHA', patterns: ['recaptcha', 'g-recaptcha'] },
  { name: 'hCaptcha', patterns: ['hcaptcha', 'h-captcha'] },
  { name: 'Distil Networks', patterns: ['distil', 'd_id'] },
  { name: 'Shape Security', patterns: ['shape', '_imp_apg'] },
];

const JS_REQUIRED_PATTERNS = [
  'javascript required',
  'enable javascript',
  'javascript is disabled',
  'please enable javascript',
  'noscript',
  'browser not supported',
  'loading...',
  '<div id="root"></div>',
  '<div id="app"></div>',
  'window.__INITIAL_STATE__',
  'window.__NEXT_DATA__',
  '__NUXT__',
];

// ============================================================================
// URL Testing Functions
// ============================================================================

/**
 * Test a single URL for accessibility and scrapeability
 */
export async function testURL(
  url: string,
  timeoutMs: number = AUDIT_LIMITS.timeoutMs
): Promise<URLAuditResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const redirects: AuditRedirect[] = [];
  let currentUrl = url;
  let finalUrl = url;
  let status = 0;
  let contentType: string | undefined;
  let html = '';
  let accessible = false;
  let blockedReason: string | undefined;
  let responseTimeMs: number | undefined;

  const startTime = Date.now();

  try {
    // First try HEAD request
    const headResponse = await fetch(currentUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    // Follow redirects manually to track them
    let response = headResponse;
    let redirectCount = 0;
    const maxRedirects = 10;

    while (
      (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) &&
      redirectCount < maxRedirects
    ) {
      const location = response.headers.get('location');
      if (!location) break;

      const nextUrl = new URL(location, currentUrl).toString();
      redirects.push({
        from: currentUrl,
        to: nextUrl,
        status: response.status,
      });

      currentUrl = nextUrl;
      redirectCount++;

      response = await fetch(currentUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    }

    finalUrl = currentUrl;
    status = response.status;
    contentType = response.headers.get('content-type') || undefined;

    // If HEAD succeeds, do GET for content analysis
    if (response.ok) {
      const getResponse = await fetch(finalUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      status = getResponse.status;
      contentType = getResponse.headers.get('content-type') || undefined;

      if (getResponse.ok && contentType?.includes('text/html')) {
        html = await getResponse.text();
        accessible = true;
      }
    }

    responseTimeMs = Date.now() - startTime;
  } catch (error) {
    responseTimeMs = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        blockedReason = 'Timeout';
        status = 408;
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        blockedReason = 'DNS resolution failed';
        status = 0;
      } else if (error.message.includes('ECONNREFUSED')) {
        blockedReason = 'Connection refused';
        status = 0;
      } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
        blockedReason = 'SSL/TLS error';
        status = 0;
      } else {
        blockedReason = error.message;
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Detect bot protections and JS requirements
  const botProtections = detectBotProtections(html);
  const jsRequired = detectJSRequired(html);

  // Calculate score
  const scoreBreakdown = calculateScoreBreakdown({
    status,
    jsRequired,
    contentType,
    botProtections,
    redirects,
  });

  // Determine recommendation
  const recommendation = getRecommendation(scoreBreakdown.total, accessible, botProtections.length > 0);

  return {
    url,
    finalUrl,
    status,
    accessible,
    redirects,
    blockedReason,
    contentType,
    jsRequired,
    botProtections,
    responseTimeMs,
    scrapeLikelihoodScore: scoreBreakdown.total,
    scoreBreakdown,
    recommendation,
  };
}

/**
 * Detect bot protection mechanisms in HTML content
 */
function detectBotProtections(html: string): string[] {
  const detected: string[] = [];
  const lowerHtml = html.toLowerCase();

  for (const protection of BOT_PROTECTION_PATTERNS) {
    for (const pattern of protection.patterns) {
      if (lowerHtml.includes(pattern.toLowerCase())) {
        if (!detected.includes(protection.name)) {
          detected.push(protection.name);
        }
        break;
      }
    }
  }

  // Check for challenge pages
  if (
    lowerHtml.includes('checking your browser') ||
    lowerHtml.includes('please wait') ||
    lowerHtml.includes('just a moment') ||
    lowerHtml.includes('ddos protection')
  ) {
    if (!detected.includes('Challenge Page')) {
      detected.push('Challenge Page');
    }
  }

  return detected;
}

/**
 * Detect if JavaScript is required to render content
 */
function detectJSRequired(html: string): boolean {
  const lowerHtml = html.toLowerCase();

  // Check for JS-required patterns
  for (const pattern of JS_REQUIRED_PATTERNS) {
    if (lowerHtml.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check if body is mostly empty (likely SPA)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();
    // If body content is very short, likely needs JS
    if (bodyContent.length < 100) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Scoring Functions
// ============================================================================

interface ScoreInput {
  status: number;
  jsRequired: boolean;
  contentType?: string;
  botProtections: string[];
  redirects: AuditRedirect[];
}

/**
 * Calculate detailed score breakdown
 */
function calculateScoreBreakdown(input: ScoreInput): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    httpStatus: 0,
    jsRequired: 0,
    htmlResponse: 0,
    botProtection: 0,
    redirectChain: 0,
    total: 0,
  };

  // HTTP Status (max 40 points)
  if (input.status === 200) {
    breakdown.httpStatus = 40;
  } else if (input.status >= 200 && input.status < 300) {
    breakdown.httpStatus = 30;
  } else if (input.status >= 300 && input.status < 400) {
    breakdown.httpStatus = 20;
  } else if (input.status === 403 || input.status === 429) {
    breakdown.httpStatus = 5;
  } else if (input.status >= 400) {
    breakdown.httpStatus = 0;
  }

  // JavaScript requirement (max 20 points)
  breakdown.jsRequired = input.jsRequired ? 0 : 20;

  // HTML response (max 15 points)
  if (input.contentType?.includes('text/html')) {
    breakdown.htmlResponse = 15;
  } else if (input.contentType?.includes('application/xhtml')) {
    breakdown.htmlResponse = 15;
  } else if (input.contentType) {
    breakdown.htmlResponse = 5;
  }

  // Bot protection (max 15 points)
  if (input.botProtections.length === 0) {
    breakdown.botProtection = 15;
  } else if (input.botProtections.length === 1) {
    breakdown.botProtection = 5;
  } else {
    breakdown.botProtection = 0;
  }

  // Redirect chain (max 10 points)
  if (input.redirects.length === 0) {
    breakdown.redirectChain = 10;
  } else if (input.redirects.length <= 2) {
    breakdown.redirectChain = 8;
  } else if (input.redirects.length <= 4) {
    breakdown.redirectChain = 4;
  } else {
    breakdown.redirectChain = 0;
  }

  // Calculate total
  breakdown.total =
    breakdown.httpStatus +
    breakdown.jsRequired +
    breakdown.htmlResponse +
    breakdown.botProtection +
    breakdown.redirectChain;

  return breakdown;
}

/**
 * Get recommendation based on score and accessibility
 */
function getRecommendation(
  score: number,
  accessible: boolean,
  hasBotProtection: boolean
): AuditRecommendation {
  if (!accessible) {
    return 'blocked';
  }

  if (score >= 85) {
    return 'best_entry_point';
  } else if (score >= 70) {
    return 'good';
  } else if (score >= 50) {
    return 'moderate';
  } else if (hasBotProtection) {
    return 'blocked';
  } else {
    return 'challenging';
  }
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process multiple URLs with controlled concurrency
 */
export async function processURLBatch(
  urls: string[],
  options: {
    concurrency?: number;
    timeoutMs?: number;
    onProgress?: (progress: AuditProgress) => void;
  } = {}
): Promise<URLAuditResult[]> {
  const {
    concurrency = AUDIT_LIMITS.concurrency,
    timeoutMs = AUDIT_LIMITS.timeoutMs,
    onProgress,
  } = options;

  const results: URLAuditResult[] = [];
  const totalUrls = urls.length;
  let completedUrls = 0;

  // Create progress reporter
  const reportProgress = (status: AuditStatus, currentStep: string) => {
    if (onProgress) {
      onProgress({
        status,
        currentStep,
        totalUrls,
        completedUrls,
        percentComplete: Math.round((completedUrls / totalUrls) * 100),
      });
    }
  };

  reportProgress('testing', 'Starting URL tests...');

  // Process in batches with concurrency limit
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchPromises = batch.map(async (url) => {
      const result = await testURL(url, timeoutMs);
      completedUrls++;
      reportProgress('testing', `Testing URLs (${completedUrls}/${totalUrls})`);
      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  reportProgress('scoring', 'Calculating scores...');

  // Sort by score descending
  results.sort((a, b) => b.scrapeLikelihoodScore - a.scrapeLikelihoodScore);

  reportProgress('completed', 'Audit complete');

  return results;
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate audit summary from results
 */
export function generateAuditSummary(results: URLAuditResult[]) {
  const totalUrls = results.length;
  const accessibleCount = results.filter((r) => r.accessible).length;
  const blockedCount = results.filter((r) => !r.accessible).length;

  const accessibleResults = results.filter((r) => r.accessible);
  const averageScore =
    accessibleResults.length > 0
      ? Math.round(
          accessibleResults.reduce((sum, r) => sum + r.scrapeLikelihoodScore, 0) /
            accessibleResults.length
        )
      : 0;

  // Find best entry points (score >= 80, accessible)
  const bestEntryPoints = results
    .filter((r) => r.accessible && r.scrapeLikelihoodScore >= 80)
    .slice(0, 5);

  // Count by status code
  const byStatus: Record<number, number> = {};
  for (const result of results) {
    const status = result.status || 0;
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  return {
    totalUrls,
    accessibleCount,
    blockedCount,
    averageScore,
    bestEntryPoints,
    byStatus,
  };
}

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validate and normalize a URL
 */
export function normalizeURL(input: string): string {
  let url = input.trim();

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }
}

/**
 * Validate an array of URLs
 */
export function validateURLs(urls: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    try {
      valid.push(normalizeURL(url));
    } catch {
      invalid.push(url);
    }
  }

  return { valid, invalid };
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(normalizeURL(url));
    return parsed.hostname;
  } catch {
    return url;
  }
}

/**
 * Group URLs by domain
 */
export function groupURLsByDomain(urls: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const url of urls) {
    const domain = extractDomain(url);
    const existing = groups.get(domain) || [];
    existing.push(url);
    groups.set(domain, existing);
  }

  return groups;
}
