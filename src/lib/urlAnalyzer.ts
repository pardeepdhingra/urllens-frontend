// ============================================================================
// URL Lens - URL Analyzer Engine
// ============================================================================

import axios, { AxiosError, type AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import type { Redirect, BotProtection, BotProtectionType, RobotsTxtResult, RateLimitDetection, UTMAnalysisResult } from '@/types';
import { parseRobotsTxt } from './robotsParser';
import { detectRateLimit } from './rateLimitDetector';
import { analyzeParameterFlow } from './utmAnalyzer';

// Type alias for cheerio loaded document
type CheerioDocument = ReturnType<typeof cheerio.load>;

// Analyzer configuration
const CONFIG = {
  timeout: 10000, // 10 seconds
  maxRedirects: 10,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Bot protection signatures
const BOT_PROTECTION_SIGNATURES: Array<{
  type: BotProtectionType;
  patterns: RegExp[];
  headerPatterns?: Array<{ header: string; pattern: RegExp }>;
  confidence: 'low' | 'medium' | 'high';
}> = [
  {
    type: 'cloudflare',
    patterns: [
      /cloudflare/i,
      /cf-ray/i,
      /__cf_bm/i,
      /cdn-cgi/i,
      /challenge-platform/i,
    ],
    headerPatterns: [
      { header: 'server', pattern: /cloudflare/i },
      { header: 'cf-ray', pattern: /.+/ },
    ],
    confidence: 'high',
  },
  {
    type: 'recaptcha',
    patterns: [
      /google\.com\/recaptcha/i,
      /grecaptcha/i,
      /g-recaptcha/i,
      /recaptcha-token/i,
    ],
    confidence: 'high',
  },
  {
    type: 'hcaptcha',
    patterns: [/hcaptcha\.com/i, /h-captcha/i, /hcaptcha-response/i],
    confidence: 'high',
  },
  {
    type: 'datadome',
    patterns: [/datadome/i, /dd\.js/i, /datadome\.co/i],
    headerPatterns: [{ header: 'x-datadome', pattern: /.+/ }],
    confidence: 'high',
  },
  {
    type: 'akamai',
    patterns: [/akamai/i, /akam\//i, /_abck/i, /bm_sz/i],
    headerPatterns: [{ header: 'x-akamai-transformed', pattern: /.+/ }],
    confidence: 'medium',
  },
  {
    type: 'imperva',
    patterns: [/imperva/i, /incapsula/i, /visid_incap/i, /incap_ses/i],
    headerPatterns: [{ header: 'x-iinfo', pattern: /.+/ }],
    confidence: 'high',
  },
  {
    type: 'perimeterx',
    patterns: [/perimeterx/i, /px\.js/i, /_pxhd/i, /_px3/i],
    headerPatterns: [{ header: 'x-px-cd', pattern: /.+/ }],
    confidence: 'high',
  },
  {
    type: 'fingerprinting',
    patterns: [
      /fingerprintjs/i,
      /fp\.js/i,
      /canvas\.toDataURL/i,
      /webgl.*fingerprint/i,
      /audioContext.*fingerprint/i,
    ],
    confidence: 'medium',
  },
];

// JavaScript detection patterns
const JS_DETECTION_PATTERNS = [
  // SPA frameworks
  /__NEXT_DATA__/i,
  /__NUXT__/i,
  /ng-app/i,
  /ng-controller/i,
  /data-reactroot/i,
  /data-react-checksum/i,
  /_react/i,
  /vue/i,
  /svelte/i,
  // Dynamic content indicators
  /document\.write/i,
  /innerHTML/i,
  /window\.onload/i,
  /DOMContentLoaded/i,
  // AJAX/Fetch patterns
  /XMLHttpRequest/i,
  /fetch\s*\(/i,
  /axios/i,
  // State management
  /redux/i,
  /vuex/i,
  /mobx/i,
  // Dynamic rendering hints
  /loading\.\.\./i,
  /skeleton/i,
  /placeholder/i,
  /lazy-load/i,
];

export interface AnalyzerResult {
  url: string;
  finalUrl: string;
  status: number;
  redirects: Redirect[];
  jsHints: boolean;
  botProtections: BotProtection[];
  responseTimeMs: number;
  contentType: string | null;
  headers: Record<string, string>;
  robotsTxt?: RobotsTxtResult;
  rateLimitInfo?: RateLimitDetection;
  utmAnalysis?: UTMAnalysisResult;
  error?: string;
  // Raw HTML content (only included when includeHtml option is true)
  html?: string;
}

export interface AnalyzeOptions {
  includeHtml?: boolean;
}

/**
 * Normalizes a URL by adding protocol if missing
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add https if no protocol
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  // Validate URL
  try {
    new URL(normalized);
    return normalized;
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Detects JavaScript requirements in the HTML
 */
export function detectJavaScriptHints(html: string, $: CheerioDocument): boolean {
  // Check for noscript tags with content
  const noscriptContent = $('noscript').text().trim();
  if (
    noscriptContent.length > 50 ||
    /javascript.*required|enable.*javascript|browser.*support/i.test(noscriptContent)
  ) {
    return true;
  }

  // Check for SPA root with minimal content
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const mainContent = $('main, article, #app, #root, .content').text().trim();
  if (bodyText.length < 200 && mainContent.length < 50) {
    return true;
  }

  // Check for JS detection patterns in HTML
  for (const pattern of JS_DETECTION_PATTERNS) {
    if (pattern.test(html)) {
      return true;
    }
  }

  // Check for excessive script tags
  const scriptCount = $('script').length;
  if (scriptCount > 15) {
    return true;
  }

  return false;
}

/**
 * Detects bot protection mechanisms
 */
export function detectBotProtections(
  html: string,
  headers: Record<string, string>
): BotProtection[] {
  const detectedProtections: BotProtection[] = [];
  const detectedTypes = new Set<BotProtectionType>();

  for (const signature of BOT_PROTECTION_SIGNATURES) {
    let detected = false;
    let details: string | undefined;

    // Check HTML patterns
    for (const pattern of signature.patterns) {
      if (pattern.test(html)) {
        detected = true;
        details = `Pattern found in page content`;
        break;
      }
    }

    // Check header patterns
    if (!detected && signature.headerPatterns) {
      for (const { header, pattern } of signature.headerPatterns) {
        const headerValue = headers[header.toLowerCase()];
        if (headerValue && pattern.test(headerValue)) {
          detected = true;
          details = `Detected via ${header} header`;
          break;
        }
      }
    }

    if (detected && !detectedTypes.has(signature.type)) {
      detectedTypes.add(signature.type);
      detectedProtections.push({
        type: signature.type,
        confidence: signature.confidence,
        details,
      });
    }
  }

  // Check for generic rate limiting indicators
  const rateLimitHeaders = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-rate-limit-limit',
    'retry-after',
  ];

  for (const header of rateLimitHeaders) {
    if (headers[header.toLowerCase()]) {
      if (!detectedTypes.has('rate_limiting')) {
        detectedProtections.push({
          type: 'rate_limiting',
          confidence: 'medium',
          details: `Rate limit header detected: ${header}`,
        });
        detectedTypes.add('rate_limiting');
      }
      break;
    }
  }

  return detectedProtections;
}

/**
 * Main URL analyzer function
 */
export async function analyzeUrl(inputUrl: string, options?: AnalyzeOptions): Promise<AnalyzerResult> {
  const startTime = Date.now();
  const redirects: Redirect[] = [];
  let currentUrl = normalizeUrl(inputUrl);
  const originalUrl = currentUrl;

  try {
    // Perform the request with redirect tracking
    const response: AxiosResponse = await axios.get(currentUrl, {
      timeout: CONFIG.timeout,
      maxRedirects: CONFIG.maxRedirects,
      headers: {
        'User-Agent': CONFIG.userAgent,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      validateStatus: () => true, // Accept all status codes
      // Track redirects manually
      beforeRedirect: (options, responseDetails) => {
        redirects.push({
          from: currentUrl,
          to: responseDetails.headers.location || options.href || '',
          status: responseDetails.statusCode || 0,
        });
        currentUrl = responseDetails.headers.location || options.href || currentUrl;
      },
    });

    const responseTimeMs = Date.now() - startTime;
    const finalUrl = response.request?.res?.responseUrl || currentUrl;
    const html = typeof response.data === 'string' ? response.data : '';

    // Parse HTML
    const $ = cheerio.load(html);

    // Extract headers as plain object
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers)) {
      if (typeof value === 'string') {
        headers[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        headers[key.toLowerCase()] = value.join(', ');
      }
    }

    // Detect JS requirements and bot protections
    const jsHints = detectJavaScriptHints(html, $);
    const botProtections = detectBotProtections(html, headers);

    // Fetch robots.txt and detect rate limiting in parallel
    const [robotsTxt, rateLimitInfo] = await Promise.all([
      parseRobotsTxt(finalUrl).catch(() => undefined),
      detectRateLimit(finalUrl).catch(() => undefined),
    ]);

    // Analyze UTM/parameter flow through redirects
    const redirectUrls = [originalUrl, ...redirects.map(r => r.to)];
    if (finalUrl && !redirectUrls.includes(finalUrl)) {
      redirectUrls.push(finalUrl);
    }
    const utmAnalysis = analyzeParameterFlow(redirectUrls);

    return {
      url: originalUrl,
      finalUrl,
      status: response.status,
      redirects,
      jsHints,
      botProtections,
      responseTimeMs,
      contentType: headers['content-type'] || null,
      headers,
      robotsTxt,
      rateLimitInfo,
      utmAnalysis,
      // Only include HTML if requested (to save memory)
      ...(options?.includeHtml && { html }),
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    if (error instanceof AxiosError) {
      return {
        url: originalUrl,
        finalUrl: currentUrl,
        status: error.response?.status || 0,
        redirects,
        jsHints: false,
        botProtections: [],
        responseTimeMs,
        contentType: null,
        headers: {},
        error: error.message,
      };
    }

    throw error;
  }
}
