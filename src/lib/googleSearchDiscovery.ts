// ============================================================================
// URL Lens - Google Search Discovery
// Uses Google Custom Search API to discover indexed pages for a domain
// Free tier: 100 queries/day
// ============================================================================

import { DiscoveredURL, DiscoverySourceType } from '@/types/audit';

// ============================================================================
// Types
// ============================================================================

interface GoogleSearchResult {
  items?: Array<{
    link: string;
    title?: string;
    snippet?: string;
  }>;
  searchInformation?: {
    totalResults: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

export interface GoogleDiscoveryResult {
  urls: DiscoveredURL[];
  totalResults: number;
  error?: string;
  quotaExceeded?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

// Read env vars at call time to support testing
function getGoogleApiKey(): string | undefined {
  return process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
}

function getGoogleCseId(): string | undefined {
  return process.env.GOOGLE_CSE_ID || process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
}

// Google Custom Search API limits
const MAX_RESULTS_PER_QUERY = 10; // Google returns max 10 per request
const MAX_PAGES_TO_FETCH = 3; // Fetch up to 3 pages (30 results) to conserve quota

// ============================================================================
// Main Discovery Function
// ============================================================================

/**
 * Discover URLs for a domain using Google Custom Search API
 * Uses the `site:` operator to find indexed pages
 */
export async function discoverUrlsFromGoogle(
  domain: string,
  options: {
    maxResults?: number;
    includeSubdomains?: boolean;
  } = {}
): Promise<GoogleDiscoveryResult> {
  const { maxResults = 30, includeSubdomains = true } = options;

  // Check if API is configured
  const apiKey = getGoogleApiKey();
  const cseId = getGoogleCseId();

  if (!apiKey || !cseId) {
    return {
      urls: [],
      totalResults: 0,
      error: 'Google Search API not configured. Set GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables.',
    };
  }

  const normalizedDomain = normalizeDomain(domain);
  const allUrls: DiscoveredURL[] = [];
  let totalResults = 0;

  try {
    // Calculate how many pages to fetch
    const pagesToFetch = Math.min(
      Math.ceil(maxResults / MAX_RESULTS_PER_QUERY),
      MAX_PAGES_TO_FETCH
    );

    for (let page = 0; page < pagesToFetch; page++) {
      const startIndex = page * MAX_RESULTS_PER_QUERY + 1;

      // Build search query
      const searchQuery = includeSubdomains
        ? `site:${normalizedDomain}` // Includes subdomains
        : `site:${normalizedDomain} -site:*.${normalizedDomain}`; // Exact domain only

      const url = buildSearchUrl(searchQuery, startIndex, apiKey, cseId);
      const result = await fetchSearchResults(url);

      if (result.error) {
        // Check for quota exceeded
        if (result.error.code === 429 || result.error.message?.includes('quota')) {
          return {
            urls: allUrls,
            totalResults,
            error: 'Google API daily quota exceeded (100 free queries/day)',
            quotaExceeded: true,
          };
        }

        return {
          urls: allUrls,
          totalResults,
          error: result.error.message || 'Google Search API error',
        };
      }

      // Get total results count from first request
      if (page === 0 && result.searchInformation?.totalResults) {
        totalResults = parseInt(result.searchInformation.totalResults, 10);
      }

      // Extract URLs from results
      if (result.items) {
        for (const item of result.items) {
          if (item.link && isValidDomainUrl(item.link, normalizedDomain, includeSubdomains)) {
            allUrls.push({
              url: item.link,
              source: 'google_index' as DiscoverySourceType,
            });
          }
        }
      }

      // Stop if we have enough results or no more results
      if (!result.items || result.items.length < MAX_RESULTS_PER_QUERY) {
        break;
      }

      if (allUrls.length >= maxResults) {
        break;
      }
    }

    // Deduplicate URLs
    const uniqueUrls = deduplicateUrls(allUrls);

    return {
      urls: uniqueUrls.slice(0, maxResults),
      totalResults,
    };
  } catch (error) {
    return {
      urls: allUrls,
      totalResults: 0,
      error: error instanceof Error ? error.message : 'Unknown error during Google search',
    };
  }
}

/**
 * Search for sitemaps using Google
 * Uses query: site:domain.com filetype:xml inurl:sitemap
 */
export async function discoverSitemapsFromGoogle(
  domain: string
): Promise<{ sitemapUrls: string[]; error?: string }> {
  const apiKey = getGoogleApiKey();
  const cseId = getGoogleCseId();

  if (!apiKey || !cseId) {
    return {
      sitemapUrls: [],
      error: 'Google Search API not configured',
    };
  }

  const normalizedDomain = normalizeDomain(domain);

  try {
    // Search for XML files that might be sitemaps
    const searchQuery = `site:${normalizedDomain} (filetype:xml inurl:sitemap OR inurl:sitemap.xml)`;
    const url = buildSearchUrl(searchQuery, 1, apiKey, cseId);
    const result = await fetchSearchResults(url);

    if (result.error) {
      return {
        sitemapUrls: [],
        error: result.error.message,
      };
    }

    const sitemapUrls: string[] = [];

    if (result.items) {
      for (const item of result.items) {
        if (item.link && isSitemapUrl(item.link)) {
          sitemapUrls.push(item.link);
        }
      }
    }

    return { sitemapUrls };
  } catch (error) {
    return {
      sitemapUrls: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build Google Custom Search API URL
 */
function buildSearchUrl(query: string, startIndex: number, apiKey: string, cseId: string): string {
  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: query,
    start: startIndex.toString(),
    num: MAX_RESULTS_PER_QUERY.toString(),
  });

  return `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
}

/**
 * Fetch search results from Google API
 */
async function fetchSearchResults(url: string): Promise<GoogleSearchResult> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      error: {
        code: response.status,
        message: data.error?.message || `HTTP ${response.status}`,
      },
    };
  }

  return data;
}

/**
 * Normalize domain name
 */
function normalizeDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase();
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/\/$/, '');
  normalized = normalized.split('/')[0];
  return normalized;
}

/**
 * Check if URL belongs to the target domain
 */
function isValidDomainUrl(
  urlString: string,
  targetDomain: string,
  includeSubdomains: boolean
): boolean {
  try {
    const url = new URL(urlString);
    const urlDomain = url.hostname.toLowerCase();

    if (includeSubdomains) {
      return urlDomain === targetDomain || urlDomain.endsWith(`.${targetDomain}`);
    } else {
      return urlDomain === targetDomain;
    }
  } catch {
    return false;
  }
}

/**
 * Check if URL looks like a sitemap
 */
function isSitemapUrl(urlString: string): boolean {
  const lower = urlString.toLowerCase();
  return (
    lower.includes('sitemap') &&
    (lower.endsWith('.xml') || lower.includes('.xml?'))
  );
}

/**
 * Deduplicate URLs
 */
function deduplicateUrls(urls: DiscoveredURL[]): DiscoveredURL[] {
  const seen = new Map<string, DiscoveredURL>();

  for (const item of urls) {
    const normalizedUrl = item.url.replace(/\/$/, '');
    if (!seen.has(normalizedUrl)) {
      seen.set(normalizedUrl, item);
    }
  }

  return Array.from(seen.values());
}

/**
 * Check if Google Search API is configured
 */
export function isGoogleSearchConfigured(): boolean {
  return Boolean(getGoogleApiKey() && getGoogleCseId());
}
