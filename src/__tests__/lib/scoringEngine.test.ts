// ============================================================================
// URL Lens - Scoring Engine Tests
// ============================================================================

import {
  calculateScore,
  calculateScoreBreakdown,
  getScoreColor,
  getScoreLabel,
} from '@/lib/scoringEngine';
import type { AnalyzerResult } from '@/lib/urlAnalyzer';

describe('Scoring Engine', () => {
  const createMockResult = (overrides: Partial<AnalyzerResult> = {}): AnalyzerResult => ({
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    status: 200,
    redirects: [],
    jsHints: false,
    botProtections: [],
    responseTimeMs: 500,
    contentType: 'text/html',
    headers: {},
    ...overrides,
  });

  describe('calculateScoreBreakdown', () => {
    it('should return perfect score for clean URL', () => {
      const result = createMockResult();
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.base_score).toBe(100);
      expect(breakdown.status_penalty).toBe(0);
      expect(breakdown.redirect_penalty).toBe(0);
      expect(breakdown.js_penalty).toBe(0);
      expect(breakdown.bot_protection_penalty).toBe(0);
      expect(breakdown.final_score).toBe(100);
    });

    it('should apply penalty for 4xx status codes', () => {
      const result = createMockResult({ status: 403 });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.status_penalty).toBe(40);
      expect(breakdown.final_score).toBe(60);
    });

    it('should apply penalty for 5xx status codes', () => {
      const result = createMockResult({ status: 500 });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.status_penalty).toBe(30);
      expect(breakdown.final_score).toBe(70);
    });

    it('should apply penalty for redirects', () => {
      const result = createMockResult({
        redirects: [
          { from: 'http://example.com', to: 'https://example.com', status: 301 },
          { from: 'https://example.com', to: 'https://www.example.com', status: 301 },
        ],
      });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.redirect_penalty).toBe(6); // 2 redirects * 3 points
      expect(breakdown.final_score).toBe(94);
    });

    it('should cap redirect penalty at maximum', () => {
      const result = createMockResult({
        redirects: Array(10).fill({
          from: 'http://a.com',
          to: 'http://b.com',
          status: 301,
        }),
      });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.redirect_penalty).toBe(15); // Max penalty
    });

    it('should apply penalty for JavaScript hints', () => {
      const result = createMockResult({ jsHints: true });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.js_penalty).toBe(15);
      expect(breakdown.final_score).toBe(85);
    });

    it('should apply penalty for bot protections', () => {
      const result = createMockResult({
        botProtections: [
          { type: 'cloudflare', confidence: 'high' },
          { type: 'recaptcha', confidence: 'high' },
        ],
      });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.bot_protection_penalty).toBe(45); // 20 + 25
      expect(breakdown.final_score).toBe(55);
    });

    it('should cap bot protection penalty at maximum', () => {
      const result = createMockResult({
        botProtections: [
          { type: 'cloudflare', confidence: 'high' },
          { type: 'recaptcha', confidence: 'high' },
          { type: 'datadome', confidence: 'high' },
        ],
      });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.bot_protection_penalty).toBe(50); // Max penalty
    });

    it('should adjust penalty based on confidence level', () => {
      const highConfidence = createMockResult({
        botProtections: [{ type: 'cloudflare', confidence: 'high' }],
      });
      const lowConfidence = createMockResult({
        botProtections: [{ type: 'cloudflare', confidence: 'low' }],
      });

      const highBreakdown = calculateScoreBreakdown(highConfidence);
      const lowBreakdown = calculateScoreBreakdown(lowConfidence);

      expect(highBreakdown.bot_protection_penalty).toBe(20);
      expect(lowBreakdown.bot_protection_penalty).toBe(10); // 50% of 20
    });

    it('should not go below 0 score', () => {
      const result = createMockResult({
        status: 403,
        jsHints: true,
        botProtections: [
          { type: 'cloudflare', confidence: 'high' },
          { type: 'recaptcha', confidence: 'high' },
          { type: 'datadome', confidence: 'high' },
        ],
        redirects: Array(10).fill({
          from: 'http://a.com',
          to: 'http://b.com',
          status: 301,
        }),
      });
      const breakdown = calculateScoreBreakdown(result);

      expect(breakdown.final_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateScore', () => {
    it('should return score, recommendation, and breakdown', () => {
      const result = createMockResult();
      const { score, recommendation, breakdown } = calculateScore(result);

      expect(score).toBe(100);
      expect(recommendation).toContain('Excellent');
      expect(breakdown).toBeDefined();
    });

    it('should return appropriate recommendation for different score ranges', () => {
      const excellent = calculateScore(createMockResult());
      expect(excellent.recommendation).toContain('Excellent');

      // jsHints gives 15 penalty = 85 score = still Excellent
      const good = calculateScore(createMockResult({
        jsHints: true,
        botProtections: [{ type: 'fingerprinting', confidence: 'low' }], // Low confidence = ~7 penalty
      }));
      expect(good.recommendation).toContain('Good');

      const moderate = calculateScore(
        createMockResult({
          jsHints: true,
          botProtections: [{ type: 'cloudflare', confidence: 'high' }],
        })
      );
      expect(moderate.recommendation).toContain('Moderate');

      // Score: 100 - 15 (js) - 20 (cloudflare) - 15 (redirect max with 5 redirects) = 50, still Moderate
      // Need: 30-49 for Difficult range
      // So: status 403 = 40 penalty, leaving 60 -> need 11-30 more penalties for Difficult
      // status 403 (40) + fingerprinting low (7) = 47, score = 53 -> still Moderate
      // status 403 (40) + fingerprinting high (15) = 55, score = 45 -> Difficult!
      const difficult = calculateScore(
        createMockResult({
          status: 403,
          botProtections: [{ type: 'fingerprinting', confidence: 'high' }],
        })
      );
      // Score: 100 - 40 (403) - 15 (fingerprinting) = 45 -> Difficult range
      expect(difficult.recommendation).toContain('Difficult');
    });
  });

  describe('getScoreColor', () => {
    it('should return success for high scores', () => {
      expect(getScoreColor(100)).toBe('success');
      expect(getScoreColor(85)).toBe('success');
      expect(getScoreColor(70)).toBe('success');
    });

    it('should return warning for medium scores', () => {
      expect(getScoreColor(69)).toBe('warning');
      expect(getScoreColor(50)).toBe('warning');
      expect(getScoreColor(40)).toBe('warning');
    });

    it('should return error for low scores', () => {
      expect(getScoreColor(39)).toBe('error');
      expect(getScoreColor(20)).toBe('error');
      expect(getScoreColor(0)).toBe('error');
    });
  });

  describe('getScoreLabel', () => {
    it('should return correct labels for score ranges', () => {
      expect(getScoreLabel(100)).toBe('Excellent');
      expect(getScoreLabel(85)).toBe('Excellent');
      expect(getScoreLabel(75)).toBe('Good');
      expect(getScoreLabel(60)).toBe('Moderate');
      expect(getScoreLabel(35)).toBe('Difficult');
      expect(getScoreLabel(20)).toBe('Very Difficult');
    });
  });
});
