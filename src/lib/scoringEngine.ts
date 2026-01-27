// ============================================================================
// URL Lens - Scoring Engine
// ============================================================================

import type { AnalyzerResult } from './urlAnalyzer';
import type { ScoreBreakdown, BotProtection } from '@/types';

// Scoring configuration
const SCORING_CONFIG = {
  baseScore: 100,

  // Status code penalties
  statusPenalties: {
    // 2xx - Success (no penalty)
    '2xx': 0,
    // 3xx - Redirects (small penalty per redirect)
    '3xx': 5,
    // 4xx - Client errors
    '400': 30, // Bad request
    '401': 25, // Unauthorized
    '403': 40, // Forbidden (often bot protection)
    '404': 20, // Not found
    '405': 25, // Method not allowed
    '429': 50, // Too many requests
    '4xx': 25, // Other 4xx
    // 5xx - Server errors
    '500': 30,
    '502': 35,
    '503': 40, // Often maintenance/overload
    '5xx': 30, // Other 5xx
    // Connection errors
    '0': 60, // No response / timeout
  },

  // Redirect penalties
  redirectPenalty: {
    perRedirect: 3,
    maxPenalty: 15,
  },

  // JavaScript requirement penalty
  jsPenalty: 15,

  // Bot protection penalties
  botProtectionPenalties: {
    cloudflare: 20,
    recaptcha: 25,
    hcaptcha: 25,
    datadome: 30,
    akamai: 25,
    imperva: 30,
    perimeterx: 30,
    fingerprinting: 15,
    rate_limiting: 10,
    unknown: 15,
  },

  // Maximum total penalty from bot protections
  maxBotProtectionPenalty: 50,
};

// Recommendation thresholds
const RECOMMENDATIONS = {
  excellent: {
    min: 85,
    message:
      'Excellent scrapability! This URL should be easy to scrape with basic HTTP requests.',
  },
  good: {
    min: 70,
    message:
      'Good scrapability. Standard scraping tools should work, but watch for occasional blocks.',
  },
  moderate: {
    min: 50,
    message:
      'Moderate scrapability. Consider using headers rotation and request delays. A headless browser may be needed.',
  },
  difficult: {
    min: 30,
    message:
      'Difficult to scrape. Requires headless browser with stealth plugins, proxy rotation, and careful rate limiting.',
  },
  veryDifficult: {
    min: 0,
    message:
      'Very difficult to scrape. Heavy bot protection detected. Consider using specialized anti-detection tools or residential proxies.',
  },
};

/**
 * Calculate status code penalty
 */
function calculateStatusPenalty(status: number): number {
  const { statusPenalties } = SCORING_CONFIG;

  // Check for exact match first
  const exactMatch = statusPenalties[status.toString() as keyof typeof statusPenalties];
  if (exactMatch !== undefined) {
    return exactMatch;
  }

  // Check for category match
  if (status >= 200 && status < 300) return statusPenalties['2xx'];
  if (status >= 300 && status < 400) return statusPenalties['3xx'];
  if (status >= 400 && status < 500) return statusPenalties['4xx'];
  if (status >= 500 && status < 600) return statusPenalties['5xx'];

  // Connection error or unknown
  return statusPenalties['0'];
}

/**
 * Calculate redirect penalty
 */
function calculateRedirectPenalty(redirectCount: number): number {
  const { perRedirect, maxPenalty } = SCORING_CONFIG.redirectPenalty;
  return Math.min(redirectCount * perRedirect, maxPenalty);
}

/**
 * Calculate bot protection penalty
 */
function calculateBotProtectionPenalty(protections: BotProtection[]): number {
  const { botProtectionPenalties, maxBotProtectionPenalty } = SCORING_CONFIG;

  let totalPenalty = 0;
  const seenTypes = new Set<string>();

  for (const protection of protections) {
    // Avoid double counting same protection type
    if (seenTypes.has(protection.type)) continue;
    seenTypes.add(protection.type);

    const basePenalty =
      botProtectionPenalties[protection.type as keyof typeof botProtectionPenalties] ||
      botProtectionPenalties.unknown;

    // Adjust based on confidence
    let adjustedPenalty = basePenalty;
    if (protection.confidence === 'low') {
      adjustedPenalty = Math.round(basePenalty * 0.5);
    } else if (protection.confidence === 'medium') {
      adjustedPenalty = Math.round(basePenalty * 0.75);
    }

    totalPenalty += adjustedPenalty;
  }

  return Math.min(totalPenalty, maxBotProtectionPenalty);
}

/**
 * Get recommendation based on score
 */
function getRecommendation(score: number): string {
  if (score >= RECOMMENDATIONS.excellent.min) {
    return RECOMMENDATIONS.excellent.message;
  }
  if (score >= RECOMMENDATIONS.good.min) {
    return RECOMMENDATIONS.good.message;
  }
  if (score >= RECOMMENDATIONS.moderate.min) {
    return RECOMMENDATIONS.moderate.message;
  }
  if (score >= RECOMMENDATIONS.difficult.min) {
    return RECOMMENDATIONS.difficult.message;
  }
  return RECOMMENDATIONS.veryDifficult.message;
}

/**
 * Calculate full score breakdown
 */
export function calculateScoreBreakdown(result: AnalyzerResult): ScoreBreakdown {
  const { baseScore, jsPenalty } = SCORING_CONFIG;

  const statusPenalty = calculateStatusPenalty(result.status);
  const redirectPenalty = calculateRedirectPenalty(result.redirects.length);
  const jsHintPenalty = result.jsHints ? jsPenalty : 0;
  const botProtectionPenalty = calculateBotProtectionPenalty(result.botProtections);

  const totalPenalty =
    statusPenalty + redirectPenalty + jsHintPenalty + botProtectionPenalty;

  const finalScore = Math.max(0, Math.min(100, baseScore - totalPenalty));

  return {
    base_score: baseScore,
    status_penalty: statusPenalty,
    redirect_penalty: redirectPenalty,
    js_penalty: jsHintPenalty,
    bot_protection_penalty: botProtectionPenalty,
    final_score: finalScore,
  };
}

/**
 * Calculate scrapability score and recommendation
 */
export function calculateScore(result: AnalyzerResult): {
  score: number;
  recommendation: string;
  breakdown: ScoreBreakdown;
} {
  const breakdown = calculateScoreBreakdown(result);
  const recommendation = getRecommendation(breakdown.final_score);

  return {
    score: breakdown.final_score,
    recommendation,
    breakdown,
  };
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'error';
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}
