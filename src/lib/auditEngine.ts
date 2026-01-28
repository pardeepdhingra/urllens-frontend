// ============================================================================
// URL Lens - Audit Engine
// Batch URL processing that REUSES the single URL analysis infrastructure
// ============================================================================

import { analyzeUrl, normalizeUrl, type AnalyzerResult } from './urlAnalyzer';
import { calculateScore } from './scoringEngine';
import type {
  URLAuditResult,
  AuditSummary,
  AuditRecommendation,
  AuditProgress,
  AuditStatus,
  ScoreBreakdown,
  AUDIT_LIMITS,
} from '@/types/audit';

// ============================================================================
// Configuration
// ============================================================================

const AUDIT_CONFIG = {
  // Number of URLs to process concurrently in each batch
  batchSize: 5,
  // Delay between batches (ms) to avoid overwhelming servers
  batchDelayMs: 500,
  // Maximum URLs per audit session
  maxUrls: 500,
  // Timeout per URL (ms)
  timeoutMs: 15000,
};

// ============================================================================
// Single URL Analysis (wrapper around existing analyzeUrl)
// ============================================================================

/**
 * Analyzes a single URL using the SAME logic as single URL analysis
 * and converts the result to URLAuditResult format
 */
async function analyzeUrlForAudit(url: string): Promise<URLAuditResult> {
  try {
    // Use the EXACT SAME analyzeUrl function as single URL analysis
    // This ensures consistency between single URL and batch analysis
    const result: AnalyzerResult = await analyzeUrl(url);

    // Use the EXACT SAME scoring engine as single URL analysis
    const { score, recommendation, breakdown } = calculateScore(result);

    // Convert to URLAuditResult format
    const auditResult: URLAuditResult = {
      url: result.url,
      finalUrl: result.finalUrl,
      status: result.status,
      accessible: result.status >= 200 && result.status < 400 && !result.error,
      scrapeLikelihoodScore: score,
      recommendation: mapScoreToRecommendation(score, result),
      jsRequired: result.jsHints,
      botProtections: result.botProtections.map(bp => bp.type),
      redirects: result.redirects.map(r => ({
        from: r.from,
        to: r.to,
        status: r.status,
      })),
      contentType: result.contentType || undefined,
      responseTimeMs: result.responseTimeMs,
      blockedReason: result.error || getBlockedReason(result),
      scoreBreakdown: {
        httpStatus: Math.max(0, 40 - (breakdown.status_penalty || 0)),
        jsRequired: result.jsHints ? 0 : 20,
        htmlResponse: result.contentType?.includes('text/html') ? 15 : 0,
        botProtection: Math.max(0, 15 - Math.min(15, breakdown.bot_protection_penalty || 0)),
        redirectChain: Math.max(0, 10 - (breakdown.redirect_penalty || 0)),
        total: score,
      },
    };

    return auditResult;
  } catch (error) {
    // Return error result
    return {
      url,
      finalUrl: url,
      status: 0,
      accessible: false,
      scrapeLikelihoodScore: 0,
      recommendation: 'blocked',
      jsRequired: false,
      botProtections: [],
      redirects: [],
      blockedReason: error instanceof Error ? error.message : 'Unknown error',
      scoreBreakdown: {
        httpStatus: 0,
        jsRequired: 0,
        htmlResponse: 0,
        botProtection: 0,
        redirectChain: 0,
        total: 0,
      },
    };
  }
}

/**
 * Maps a score to an audit recommendation
 */
function mapScoreToRecommendation(score: number, result: AnalyzerResult): AuditRecommendation {
  // Check for blocking conditions first
  if (result.error || result.status === 0) {
    return 'blocked';
  }
  if (result.status >= 400) {
    return 'blocked';
  }

  // Map score to recommendation
  if (score >= 85) {
    // Check if this could be a best entry point
    if (!result.jsHints && result.botProtections.length === 0 && result.redirects.length <= 1) {
      return 'best_entry_point';
    }
    return 'good';
  }
  if (score >= 70) {
    return 'good';
  }
  if (score >= 50) {
    return 'moderate';
  }
  if (score >= 30) {
    return 'challenging';
  }
  return 'blocked';
}

/**
 * Gets blocked reason from analysis result
 */
function getBlockedReason(result: AnalyzerResult): string | undefined {
  if (result.status === 403) {
    return 'Access forbidden (403)';
  }
  if (result.status === 401) {
    return 'Authentication required (401)';
  }
  if (result.status === 404) {
    return 'Page not found (404)';
  }
  if (result.status === 429) {
    return 'Rate limited (429)';
  }
  if (result.status >= 500) {
    return `Server error (${result.status})`;
  }
  if (result.botProtections.some(bp => ['cloudflare', 'datadome', 'perimeterx', 'imperva'].includes(bp.type))) {
    return 'Protected by WAF/bot detection';
  }
  return undefined;
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process a batch of URLs concurrently
 */
async function processBatch(
  urls: string[],
  signal?: AbortSignal
): Promise<URLAuditResult[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      // Check for abort signal
      if (signal?.aborted) {
        return {
          url,
          finalUrl: url,
          status: 0,
          accessible: false,
          scrapeLikelihoodScore: 0,
          recommendation: 'blocked' as const,
          jsRequired: false,
          botProtections: [],
          redirects: [],
          blockedReason: 'Audit cancelled',
          scoreBreakdown: {
            httpStatus: 0,
            jsRequired: 0,
            htmlResponse: 0,
            botProtection: 0,
            redirectChain: 0,
            total: 0,
          },
        };
      }

      return analyzeUrlForAudit(url);
    })
  );

  return results;
}

/**
 * Process multiple URLs with controlled concurrency and progress updates
 * Results are sent progressively after each batch completes
 */
export async function processURLBatch(
  urls: string[],
  options: {
    concurrency?: number;
    timeoutMs?: number;
    onProgress?: (progress: AuditProgress) => void;
    signal?: AbortSignal;
  } = {}
): Promise<URLAuditResult[]> {
  const {
    concurrency = AUDIT_CONFIG.batchSize,
    onProgress,
    signal,
  } = options;

  const allResults: URLAuditResult[] = [];
  const totalUrls = Math.min(urls.length, AUDIT_CONFIG.maxUrls);
  const urlsToProcess = urls.slice(0, AUDIT_CONFIG.maxUrls);

  // Report initial progress
  onProgress?.({
    status: 'testing',
    currentStep: 'Starting URL analysis...',
    totalUrls,
    completedUrls: 0,
    percentComplete: 0,
  });

  // Process in batches
  for (let i = 0; i < totalUrls; i += concurrency) {
    // Check for abort
    if (signal?.aborted) {
      break;
    }

    const batch = urlsToProcess.slice(i, i + concurrency);
    const batchNumber = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(totalUrls / concurrency);

    // Report progress before batch
    onProgress?.({
      status: 'testing',
      currentStep: `Analyzing batch ${batchNumber} of ${totalBatches}...`,
      totalUrls,
      completedUrls: allResults.length,
      percentComplete: Math.round((allResults.length / totalUrls) * 100),
    });

    // Process batch using the same analysis as single URL
    const batchResults = await processBatch(batch, signal);
    allResults.push(...batchResults);

    // Report progress after batch with latest results for progressive UI update
    onProgress?.({
      status: 'testing',
      currentStep: `Completed batch ${batchNumber} of ${totalBatches}`,
      totalUrls,
      completedUrls: allResults.length,
      percentComplete: Math.round((allResults.length / totalUrls) * 100),
      // Include latest batch results for progressive UI updates
      latestResults: batchResults,
    });

    // Delay between batches (except for last batch)
    if (i + concurrency < totalUrls && !signal?.aborted) {
      await new Promise(resolve => setTimeout(resolve, AUDIT_CONFIG.batchDelayMs));
    }
  }

  // Sort by score descending
  allResults.sort((a, b) => b.scrapeLikelihoodScore - a.scrapeLikelihoodScore);

  // Report completion
  onProgress?.({
    status: 'completed',
    currentStep: 'Audit complete',
    totalUrls,
    completedUrls: allResults.length,
    percentComplete: 100,
  });

  return allResults;
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate audit summary from results
 */
export function generateAuditSummary(results: URLAuditResult[]): AuditSummary {
  const totalUrls = results.length;
  const accessibleCount = results.filter(r => r.accessible).length;
  const blockedCount = results.filter(r => !r.accessible).length;
  const jsRequiredCount = results.filter(r => r.jsRequired).length;

  // Calculate average score of accessible URLs
  const accessibleResults = results.filter(r => r.accessible);
  const averageScore = accessibleResults.length > 0
    ? Math.round(accessibleResults.reduce((sum, r) => sum + r.scrapeLikelihoodScore, 0) / accessibleResults.length)
    : 0;

  // Count recommendations
  const recommendationBreakdown = {
    best_entry_point: results.filter(r => r.recommendation === 'best_entry_point').length,
    good: results.filter(r => r.recommendation === 'good').length,
    moderate: results.filter(r => r.recommendation === 'moderate').length,
    challenging: results.filter(r => r.recommendation === 'challenging').length,
    blocked: results.filter(r => r.recommendation === 'blocked').length,
  };

  // Find best entry points (score >= 80, accessible)
  const bestEntryPoints = results
    .filter(r => r.accessible && r.scrapeLikelihoodScore >= 80)
    .slice(0, 5);

  // Count bot protections
  const protectionCounts: Record<string, number> = {};
  for (const result of results) {
    for (const protection of result.botProtections) {
      protectionCounts[protection] = (protectionCounts[protection] || 0) + 1;
    }
  }

  const commonProtections = Object.entries(protectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalUrls,
    accessibleCount,
    blockedCount,
    averageScore,
    jsRequiredCount,
    recommendationBreakdown,
    bestEntryPoints,
    commonProtections,
  };
}

// ============================================================================
// URL Validation (reuses normalizeUrl from urlAnalyzer)
// ============================================================================

/**
 * Validate and normalize a URL (reuses existing normalizeUrl)
 */
export function normalizeURL(input: string): string {
  return normalizeUrl(input);
}

/**
 * Validate an array of URLs
 */
export function validateURLs(urls: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    try {
      valid.push(normalizeUrl(url.trim()));
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
    const parsed = new URL(normalizeUrl(url));
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

// ============================================================================
// Export config
// ============================================================================

export { AUDIT_CONFIG };
