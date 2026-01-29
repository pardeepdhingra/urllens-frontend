// ============================================================================
// URL Lens - Domain Discovery Engine
// Discovers URLs from sitemaps, robots.txt, common paths, and Google Search
// ============================================================================

import {
  DomainDiscoveryResult,
  DiscoveredURL,
  DiscoverySource,
  DiscoverySourceType,
  COMMON_PATHS,
  SITEMAP_PATHS,
  AUDIT_LIMITS,
} from '@/types/audit';
import { parseRobotsTxt } from './robotsParser';
import { discoverUrlsFromGoogle, isGoogleSearchConfigured } from './googleSearchDiscovery';

// ============================================================================
// Main Discovery Function
// ============================================================================

/**
 * Discover URLs for a domain using multiple discovery methods
 */
export async function discoverDomainURLs(
  domain: string,
  options: {
    maxUrls?: number;
    timeoutMs?: number;
    includeCommonPaths?: boolean;
  } = {}
): Promise<DomainDiscoveryResult> {
  const {
    maxUrls = AUDIT_LIMITS.maxUrlsPerDomain,
    timeoutMs = AUDIT_LIMITS.timeoutMs,
    includeCommonPaths = true,
  } = options;

  const normalizedDomain = normalizeDomain(domain);
  const baseUrl = `https://${normalizedDomain}`;

  const result: DomainDiscoveryResult = {
    domain: normalizedDomain,
    rootAccessible: false,
    discoveredUrls: [],
    sources: [],
  };

  // Step 1: Check if root domain is accessible
  const rootCheck = await checkRootAccessibility(baseUrl, timeoutMs);
  result.rootAccessible = rootCheck.accessible;
  result.rootStatus = rootCheck.status;
  result.rootBlockedReason = rootCheck.blockedReason;

  // Step 2: Parse robots.txt for sitemaps
  const robotsSitemaps = await discoverSitemapsFromRobots(baseUrl);
  if (robotsSitemaps.urls.length > 0) {
    result.sources.push({
      type: 'robots_txt',
      url: `${baseUrl}/robots.txt`,
      urlsFound: robotsSitemaps.urls.length,
    });
    result.discoveredUrls.push(...robotsSitemaps.urls);
  }

  // Step 3: Check standard sitemap locations
  const standardSitemaps = await discoverStandardSitemaps(baseUrl, timeoutMs);
  for (const source of standardSitemaps.sources) {
    result.sources.push(source);
  }
  result.discoveredUrls.push(...standardSitemaps.urls);

  // Step 4: Test common paths
  if (includeCommonPaths) {
    const commonPathUrls = await discoverCommonPaths(baseUrl, timeoutMs);
    if (commonPathUrls.length > 0) {
      result.sources.push({
        type: 'common_path',
        url: baseUrl,
        urlsFound: commonPathUrls.length,
      });
      result.discoveredUrls.push(...commonPathUrls);
    }
  }

  // Step 5: Google Search fallback (if not enough URLs found)
  // Uses Google Custom Search API - 100 free queries/day
  const MIN_URLS_BEFORE_GOOGLE_FALLBACK = 10;
  if (result.discoveredUrls.length < MIN_URLS_BEFORE_GOOGLE_FALLBACK && isGoogleSearchConfigured()) {
    const googleResults = await discoverUrlsFromGoogle(normalizedDomain, {
      maxResults: maxUrls - result.discoveredUrls.length,
      includeSubdomains: true,
    });

    if (googleResults.urls.length > 0) {
      result.sources.push({
        type: 'google_index',
        url: `https://www.google.com/search?q=site:${normalizedDomain}`,
        urlsFound: googleResults.urls.length,
      });
      result.discoveredUrls.push(...googleResults.urls);
    }
  }

  // Step 6: Deduplicate and limit URLs
  result.discoveredUrls = deduplicateUrls(result.discoveredUrls);

  // Limit to maxUrls
  if (result.discoveredUrls.length > maxUrls) {
    result.discoveredUrls = result.discoveredUrls.slice(0, maxUrls);
  }

  // Always include root URL if not already present
  if (!result.discoveredUrls.some(u => u.url === baseUrl || u.url === baseUrl + '/')) {
    result.discoveredUrls.unshift({
      url: baseUrl,
      source: 'common_path',
    });
  }

  return result;
}

// ============================================================================
// Root Accessibility Check
// ============================================================================

async function checkRootAccessibility(
  baseUrl: string,
  timeoutMs: number
): Promise<{ accessible: boolean; status?: number; blockedReason?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com)',
      },
    });

    clearTimeout(timeoutId);

    return {
      accessible: response.ok,
      status: response.status,
      blockedReason: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { accessible: false, blockedReason: 'Timeout' };
      }
      return { accessible: false, blockedReason: error.message };
    }
    return { accessible: false, blockedReason: 'Unknown error' };
  }
}

// ============================================================================
// Sitemap Discovery
// ============================================================================

/**
 * Discover sitemaps from robots.txt
 */
async function discoverSitemapsFromRobots(
  baseUrl: string
): Promise<{ urls: DiscoveredURL[]; sitemaps: string[] }> {
  try {
    const robotsResult = await parseRobotsTxt(baseUrl);

    if (!robotsResult.sitemaps || robotsResult.sitemaps.length === 0) {
      return { urls: [], sitemaps: [] };
    }

    const allUrls: DiscoveredURL[] = [];

    for (const sitemapUrl of robotsResult.sitemaps) {
      const urls = await parseSitemap(sitemapUrl);
      allUrls.push(...urls.map(url => ({ url, source: 'robots_txt' as DiscoverySourceType })));
    }

    return { urls: allUrls, sitemaps: robotsResult.sitemaps };
  } catch {
    return { urls: [], sitemaps: [] };
  }
}

/**
 * Check standard sitemap locations
 */
async function discoverStandardSitemaps(
  baseUrl: string,
  timeoutMs: number
): Promise<{ urls: DiscoveredURL[]; sources: DiscoverySource[] }> {
  const result: { urls: DiscoveredURL[]; sources: DiscoverySource[] } = {
    urls: [],
    sources: [],
  };

  for (const path of SITEMAP_PATHS) {
    const sitemapUrl = `${baseUrl}${path}`;

    try {
      const urls = await parseSitemap(sitemapUrl, timeoutMs);

      if (urls.length > 0) {
        // Check if this is a sitemap index
        const isIndex = path.includes('index');

        result.sources.push({
          type: isIndex ? 'sitemap_index' : 'sitemap',
          url: sitemapUrl,
          urlsFound: urls.length,
        });

        result.urls.push(...urls.map(url => ({
          url,
          source: (isIndex ? 'sitemap_index' : 'sitemap') as DiscoverySourceType,
        })));
      }
    } catch {
      // Sitemap not found or parsing failed, continue
    }
  }

  return result;
}

/**
 * Parse a sitemap XML and extract URLs
 */
async function parseSitemap(
  sitemapUrl: string,
  timeoutMs: number = AUDIT_LIMITS.timeoutMs
): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com)',
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('xml') && !contentType.includes('text/plain')) {
      return [];
    }

    const xml = await response.text();
    return extractUrlsFromSitemap(xml, sitemapUrl);
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

/**
 * Extract URLs from sitemap XML content
 */
function extractUrlsFromSitemap(xml: string, sitemapUrl: string): string[] {
  const urls: string[] = [];

  // Check if this is a sitemap index
  const isSitemapIndex = xml.includes('<sitemapindex');

  if (isSitemapIndex) {
    // Extract sitemap URLs from index
    const sitemapMatches = xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc[^>]*>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi);

    for (const match of sitemapMatches) {
      const url = match[1].trim();
      if (url && isValidUrl(url)) {
        urls.push(url);
      }
    }
  } else {
    // Extract URLs from regular sitemap
    const urlMatches = xml.matchAll(/<url[^>]*>[\s\S]*?<loc[^>]*>([^<]+)<\/loc>[\s\S]*?<\/url>/gi);

    for (const match of urlMatches) {
      const url = match[1].trim();
      if (url && isValidUrl(url)) {
        urls.push(url);
      }
    }

    // Also try simpler <loc> extraction for non-standard formats
    if (urls.length === 0) {
      const locMatches = xml.matchAll(/<loc[^>]*>([^<]+)<\/loc>/gi);

      for (const match of locMatches) {
        const url = match[1].trim();
        if (url && isValidUrl(url)) {
          urls.push(url);
        }
      }
    }
  }

  return urls;
}

// ============================================================================
// Common Path Discovery
// ============================================================================

/**
 * Test common paths on a domain
 */
async function discoverCommonPaths(
  baseUrl: string,
  timeoutMs: number
): Promise<DiscoveredURL[]> {
  const urls: DiscoveredURL[] = [];

  // Test paths in parallel with limited concurrency
  const concurrency = 5;
  const paths = [...COMMON_PATHS];

  for (let i = 0; i < paths.length; i += concurrency) {
    const batch = paths.slice(i, i + concurrency);

    const promises = batch.map(async (path) => {
      const url = `${baseUrl}${path}`;
      const accessible = await checkUrlAccessibility(url, timeoutMs);
      return { url, accessible };
    });

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.accessible) {
        urls.push({
          url: result.url,
          source: 'common_path',
        });
      }
    }
  }

  return urls;
}

/**
 * Quick check if a URL is accessible
 */
async function checkUrlAccessibility(
  url: string,
  timeoutMs: number
): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs / 2); // Use shorter timeout for quick checks

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com)',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize domain name
 */
function normalizeDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase();

  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Remove path if present
  normalized = normalized.split('/')[0];

  // Remove port if present (for normalization)
  // normalized = normalized.split(':')[0];

  return normalized;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Deduplicate URLs while preserving source information
 */
function deduplicateUrls(urls: DiscoveredURL[]): DiscoveredURL[] {
  const seen = new Map<string, DiscoveredURL>();

  for (const item of urls) {
    const normalizedUrl = item.url.replace(/\/$/, ''); // Remove trailing slash for comparison

    if (!seen.has(normalizedUrl)) {
      seen.set(normalizedUrl, item);
    }
  }

  return Array.from(seen.values());
}

/**
 * Filter URLs to only include those from the target domain
 */
export function filterUrlsByDomain(urls: DiscoveredURL[], targetDomain: string): DiscoveredURL[] {
  const normalizedTarget = normalizeDomain(targetDomain);

  return urls.filter(item => {
    try {
      const url = new URL(item.url);
      const urlDomain = url.hostname.toLowerCase();

      // Match exact domain or subdomains
      return urlDomain === normalizedTarget || urlDomain.endsWith(`.${normalizedTarget}`);
    } catch {
      return false;
    }
  });
}

/**
 * Get unique domains from a list of URLs
 */
export function getUniqueDomains(urls: string[]): string[] {
  const domains = new Set<string>();

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      domains.add(parsed.hostname.toLowerCase());
    } catch {
      // Skip invalid URLs
    }
  }

  return Array.from(domains);
}
