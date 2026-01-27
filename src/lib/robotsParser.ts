// ============================================================================
// URL Lens - robots.txt Parser
// ============================================================================

import axios from 'axios';
import type { RobotsTxtResult, RobotRule } from '@/types';

const CONFIG = {
  timeout: 5000,
  userAgent: 'URLLensBot/1.0',
};

// Common bot user agents to check against
const COMMON_BOTS = [
  '*',
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'facebookexternalhit',
  'Twitterbot',
];

/**
 * Fetches and parses robots.txt for a given URL
 */
export async function parseRobotsTxt(url: string): Promise<RobotsTxtResult> {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

    const response = await axios.get(robotsUrl, {
      timeout: CONFIG.timeout,
      validateStatus: (status) => status < 500,
      headers: {
        'User-Agent': CONFIG.userAgent,
      },
    });

    if (response.status === 404) {
      return {
        exists: false,
        allowed: true, // No robots.txt means everything is allowed
        sitemaps: [],
        rules: [],
      };
    }

    if (response.status !== 200) {
      return {
        exists: false,
        allowed: true,
        sitemaps: [],
        rules: [],
      };
    }

    const content = response.data;
    if (typeof content !== 'string') {
      return {
        exists: true,
        allowed: true,
        sitemaps: [],
        rules: [],
        raw_content: String(content),
      };
    }

    // Parse the robots.txt content
    const result = parseRobotsContent(content, parsedUrl.pathname);
    result.raw_content = content;

    return result;
  } catch (error) {
    // If we can't fetch robots.txt, assume it doesn't exist
    return {
      exists: false,
      allowed: true,
      sitemaps: [],
      rules: [],
    };
  }
}

/**
 * Parses robots.txt content and checks if a path is allowed
 */
function parseRobotsContent(content: string, pathToCheck: string): RobotsTxtResult {
  const lines = content.split('\n').map((line) => line.trim());
  const rules: RobotRule[] = [];
  const sitemaps: string[] = [];
  let crawlDelay: number | undefined;

  let currentUserAgent: string | null = null;
  let currentRule: RobotRule | null = null;

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (directive) {
      case 'user-agent':
        // Save previous rule if exists
        if (currentRule && currentUserAgent) {
          rules.push(currentRule);
        }
        currentUserAgent = value;
        currentRule = {
          user_agent: value,
          allow: [],
          disallow: [],
        };
        break;

      case 'disallow':
        if (currentRule && value) {
          currentRule.disallow.push(value);
        }
        break;

      case 'allow':
        if (currentRule && value) {
          currentRule.allow.push(value);
        }
        break;

      case 'sitemap':
        if (value) {
          sitemaps.push(value);
        }
        break;

      case 'crawl-delay':
        const delay = parseFloat(value);
        if (!isNaN(delay)) {
          crawlDelay = delay;
        }
        break;
    }
  }

  // Save last rule
  if (currentRule && currentUserAgent) {
    rules.push(currentRule);
  }

  // Check if the path is allowed
  const allowed = isPathAllowed(rules, pathToCheck);

  return {
    exists: true,
    allowed,
    crawl_delay: crawlDelay,
    sitemaps,
    rules,
  };
}

/**
 * Checks if a path is allowed based on robots.txt rules
 */
function isPathAllowed(rules: RobotRule[], path: string): boolean {
  // Find the most specific matching rule
  // First check for wildcard (*) rules, then specific bot rules

  const wildcardRule = rules.find((r) => r.user_agent === '*');

  if (!wildcardRule) {
    // No rules means everything is allowed
    return true;
  }

  // Check disallow rules first
  for (const disallowPath of wildcardRule.disallow) {
    if (matchesPath(path, disallowPath)) {
      // Check if there's a more specific allow rule
      for (const allowPath of wildcardRule.allow) {
        if (matchesPath(path, allowPath) && allowPath.length > disallowPath.length) {
          return true;
        }
      }
      return false;
    }
  }

  return true;
}

/**
 * Checks if a path matches a robots.txt pattern
 */
function matchesPath(path: string, pattern: string): boolean {
  if (!pattern) return false;

  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(path);
  }

  // Handle $ (end of string) pattern
  if (pattern.endsWith('$')) {
    return path === pattern.slice(0, -1);
  }

  // Simple prefix matching
  return path.startsWith(pattern);
}

/**
 * Gets a human-readable summary of robots.txt rules
 */
export function getRobotsSummary(result: RobotsTxtResult): string {
  if (!result.exists) {
    return 'No robots.txt found - all paths are allowed by default.';
  }

  const parts: string[] = [];

  if (result.allowed) {
    parts.push('This URL is ALLOWED for crawling.');
  } else {
    parts.push('This URL is DISALLOWED for crawling.');
  }

  if (result.crawl_delay) {
    parts.push(`Crawl delay: ${result.crawl_delay} seconds.`);
  }

  if (result.sitemaps.length > 0) {
    parts.push(`${result.sitemaps.length} sitemap(s) found.`);
  }

  const totalRules = result.rules.reduce(
    (acc, r) => acc + r.allow.length + r.disallow.length,
    0
  );
  parts.push(`${totalRules} total rules across ${result.rules.length} user-agent(s).`);

  return parts.join(' ');
}
