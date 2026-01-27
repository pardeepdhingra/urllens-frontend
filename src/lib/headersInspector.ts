// ============================================================================
// URL Lens - Headers Inspector
// ============================================================================

export interface HeaderInfo {
  name: string;
  value: string;
  category: 'security' | 'caching' | 'cors' | 'content' | 'server' | 'custom' | 'other';
  description: string;
  impact: 'positive' | 'negative' | 'neutral' | 'info';
  recommendation?: string;
}

// Header explanations and categories
const HEADER_DEFINITIONS: Record<
  string,
  {
    category: HeaderInfo['category'];
    description: string;
    getImpact: (value: string) => HeaderInfo['impact'];
    getRecommendation?: (value: string) => string | undefined;
  }
> = {
  // Security Headers
  'strict-transport-security': {
    category: 'security',
    description: 'Forces HTTPS connections, preventing man-in-the-middle attacks.',
    getImpact: () => 'positive',
  },
  'content-security-policy': {
    category: 'security',
    description: 'Controls resources the browser can load, preventing XSS attacks.',
    getImpact: () => 'positive',
  },
  'x-content-type-options': {
    category: 'security',
    description: 'Prevents MIME type sniffing, reducing risk of drive-by downloads.',
    getImpact: (value) => (value.toLowerCase() === 'nosniff' ? 'positive' : 'neutral'),
  },
  'x-frame-options': {
    category: 'security',
    description: 'Controls if the page can be embedded in iframes, preventing clickjacking.',
    getImpact: () => 'positive',
    getRecommendation: (value) => {
      if (value.toLowerCase() === 'deny') {
        return 'Page cannot be embedded - may affect scraping via browser automation.';
      }
      return undefined;
    },
  },
  'x-xss-protection': {
    category: 'security',
    description: 'Legacy XSS filter (deprecated in modern browsers).',
    getImpact: () => 'neutral',
  },
  'referrer-policy': {
    category: 'security',
    description: 'Controls how much referrer information is sent with requests.',
    getImpact: () => 'neutral',
  },
  'permissions-policy': {
    category: 'security',
    description: 'Controls which browser features can be used.',
    getImpact: () => 'neutral',
  },
  'cross-origin-opener-policy': {
    category: 'security',
    description: 'Isolates browsing context for security.',
    getImpact: () => 'neutral',
  },
  'cross-origin-embedder-policy': {
    category: 'security',
    description: 'Requires cross-origin resources to explicitly allow embedding.',
    getImpact: () => 'neutral',
  },
  'cross-origin-resource-policy': {
    category: 'security',
    description: 'Controls how resources can be shared cross-origin.',
    getImpact: () => 'neutral',
  },

  // CORS Headers
  'access-control-allow-origin': {
    category: 'cors',
    description: 'Specifies which origins can access the resource.',
    getImpact: (value) => (value === '*' ? 'positive' : 'neutral'),
    getRecommendation: (value) => {
      if (value === '*') {
        return 'Wide open CORS - easy to scrape via browser-based tools.';
      }
      return 'Restricted CORS - may need server-side scraping.';
    },
  },
  'access-control-allow-methods': {
    category: 'cors',
    description: 'Specifies allowed HTTP methods for CORS requests.',
    getImpact: () => 'neutral',
  },
  'access-control-allow-headers': {
    category: 'cors',
    description: 'Specifies allowed headers for CORS requests.',
    getImpact: () => 'neutral',
  },
  'access-control-expose-headers': {
    category: 'cors',
    description: 'Headers that can be exposed to the client.',
    getImpact: () => 'neutral',
  },
  'access-control-max-age': {
    category: 'cors',
    description: 'How long CORS preflight results can be cached.',
    getImpact: () => 'neutral',
  },

  // Caching Headers
  'cache-control': {
    category: 'caching',
    description: 'Directives for caching mechanisms.',
    getImpact: (value) => {
      if (value.includes('no-store') || value.includes('no-cache')) {
        return 'negative';
      }
      return 'neutral';
    },
    getRecommendation: (value) => {
      if (value.includes('no-store')) {
        return 'Content not cacheable - each request hits the server.';
      }
      if (value.includes('max-age')) {
        const match = value.match(/max-age=(\d+)/);
        if (match) {
          const seconds = parseInt(match[1], 10);
          if (seconds > 3600) {
            return `Content cached for ${Math.round(seconds / 3600)} hours - good for reducing requests.`;
          }
        }
      }
      return undefined;
    },
  },
  etag: {
    category: 'caching',
    description: 'Unique identifier for a specific version of the resource.',
    getImpact: () => 'neutral',
  },
  'last-modified': {
    category: 'caching',
    description: 'When the resource was last modified.',
    getImpact: () => 'neutral',
  },
  expires: {
    category: 'caching',
    description: 'Date/time after which the response is stale.',
    getImpact: () => 'neutral',
  },
  vary: {
    category: 'caching',
    description: 'Headers that affect cache key selection.',
    getImpact: () => 'neutral',
  },
  age: {
    category: 'caching',
    description: 'Time in seconds the object has been in proxy cache.',
    getImpact: () => 'info',
  },

  // Content Headers
  'content-type': {
    category: 'content',
    description: 'Media type of the resource.',
    getImpact: () => 'info',
    getRecommendation: (value) => {
      if (value.includes('application/json')) {
        return 'JSON response - easy to parse.';
      }
      if (value.includes('text/html')) {
        return 'HTML response - may need DOM parsing.';
      }
      return undefined;
    },
  },
  'content-length': {
    category: 'content',
    description: 'Size of the response body in bytes.',
    getImpact: () => 'info',
  },
  'content-encoding': {
    category: 'content',
    description: 'Compression algorithm used.',
    getImpact: () => 'info',
  },
  'content-language': {
    category: 'content',
    description: 'Language(s) of the content.',
    getImpact: () => 'info',
  },
  'transfer-encoding': {
    category: 'content',
    description: 'How the message body is transferred.',
    getImpact: () => 'info',
  },

  // Server Headers
  server: {
    category: 'server',
    description: 'Information about the server software.',
    getImpact: () => 'info',
    getRecommendation: (value) => {
      const lower = value.toLowerCase();
      if (lower.includes('cloudflare')) {
        return 'Cloudflare detected - may have bot protection.';
      }
      if (lower.includes('nginx')) {
        return 'Nginx server - generally good performance.';
      }
      if (lower.includes('apache')) {
        return 'Apache server - widely used, well-documented.';
      }
      return undefined;
    },
  },
  'x-powered-by': {
    category: 'server',
    description: 'Technology stack information (often hidden for security).',
    getImpact: () => 'info',
  },
  via: {
    category: 'server',
    description: 'Proxy servers the request passed through.',
    getImpact: () => 'info',
  },
  date: {
    category: 'server',
    description: 'Date and time the response was generated.',
    getImpact: () => 'info',
  },

  // Bot Protection Headers
  'cf-ray': {
    category: 'security',
    description: 'Cloudflare Ray ID - indicates Cloudflare protection.',
    getImpact: () => 'negative',
    getRecommendation: () => 'Cloudflare is active - may need to handle challenges.',
  },
  'cf-cache-status': {
    category: 'caching',
    description: 'Cloudflare cache status.',
    getImpact: () => 'info',
  },
  'x-datadome': {
    category: 'security',
    description: 'DataDome bot protection is active.',
    getImpact: () => 'negative',
    getRecommendation: () => 'DataDome detected - sophisticated bot protection.',
  },
  'x-akamai-transformed': {
    category: 'server',
    description: 'Akamai CDN transformation applied.',
    getImpact: () => 'neutral',
  },

  // Rate Limiting Headers
  'x-ratelimit-limit': {
    category: 'security',
    description: 'Maximum requests allowed in time window.',
    getImpact: () => 'negative',
    getRecommendation: (value) => `Rate limit: ${value} requests per window.`,
  },
  'x-ratelimit-remaining': {
    category: 'security',
    description: 'Remaining requests in current window.',
    getImpact: (value) => (parseInt(value, 10) < 10 ? 'negative' : 'neutral'),
  },
  'x-ratelimit-reset': {
    category: 'security',
    description: 'When the rate limit window resets.',
    getImpact: () => 'info',
  },
  'retry-after': {
    category: 'security',
    description: 'Seconds to wait before retrying.',
    getImpact: () => 'negative',
  },
};

/**
 * Analyzes response headers and provides detailed information
 */
export function analyzeHeaders(headers: Record<string, string>): HeaderInfo[] {
  const results: HeaderInfo[] = [];

  for (const [name, value] of Object.entries(headers)) {
    const lowerName = name.toLowerCase();
    const definition = HEADER_DEFINITIONS[lowerName];

    if (definition) {
      results.push({
        name,
        value,
        category: definition.category,
        description: definition.description,
        impact: definition.getImpact(value),
        recommendation: definition.getRecommendation?.(value),
      });
    } else {
      // Unknown header
      let category: HeaderInfo['category'] = 'other';
      if (lowerName.startsWith('x-')) {
        category = 'custom';
      }

      results.push({
        name,
        value,
        category,
        description: 'Custom or non-standard header.',
        impact: 'info',
      });
    }
  }

  // Sort by category importance
  const categoryOrder: HeaderInfo['category'][] = [
    'security',
    'cors',
    'caching',
    'content',
    'server',
    'custom',
    'other',
  ];

  results.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.category);
    const bIndex = categoryOrder.indexOf(b.category);
    return aIndex - bIndex;
  });

  return results;
}

/**
 * Gets security score based on headers
 */
export function getHeadersSecurityScore(headers: Record<string, string>): {
  score: number;
  findings: string[];
} {
  const findings: string[] = [];
  let score = 100;

  const lowerHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    lowerHeaders[key.toLowerCase()] = value;
  }

  // Check for security headers
  if (!lowerHeaders['strict-transport-security']) {
    score -= 10;
    findings.push('Missing HSTS header');
  }

  if (!lowerHeaders['content-security-policy']) {
    score -= 10;
    findings.push('Missing Content Security Policy');
  }

  if (!lowerHeaders['x-content-type-options']) {
    score -= 5;
    findings.push('Missing X-Content-Type-Options');
  }

  if (!lowerHeaders['x-frame-options']) {
    score -= 5;
    findings.push('Missing X-Frame-Options');
  }

  // Check for information disclosure
  if (lowerHeaders['x-powered-by']) {
    score -= 5;
    findings.push('Server technology exposed via X-Powered-By');
  }

  if (lowerHeaders['server'] && lowerHeaders['server'].length > 20) {
    score -= 5;
    findings.push('Detailed server information exposed');
  }

  // Bot protection indicators (negative for scraping, but secure)
  if (lowerHeaders['cf-ray']) {
    findings.push('Cloudflare protection active');
  }

  if (lowerHeaders['x-datadome']) {
    findings.push('DataDome bot protection active');
  }

  return {
    score: Math.max(0, score),
    findings,
  };
}

/**
 * Groups headers by category
 */
export function groupHeadersByCategory(
  headers: HeaderInfo[]
): Record<HeaderInfo['category'], HeaderInfo[]> {
  const groups: Record<HeaderInfo['category'], HeaderInfo[]> = {
    security: [],
    cors: [],
    caching: [],
    content: [],
    server: [],
    custom: [],
    other: [],
  };

  for (const header of headers) {
    groups[header.category].push(header);
  }

  return groups;
}
