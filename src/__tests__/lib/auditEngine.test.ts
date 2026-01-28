// ============================================================================
// URL Lens - Audit Engine Tests
// ============================================================================

// Mock urlAnalyzer before importing auditEngine
jest.mock('@/lib/urlAnalyzer', () => ({
  analyzeUrl: jest.fn(),
  normalizeUrl: (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) throw new Error('Invalid URL format');
    const withProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    try {
      return new URL(withProtocol).toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  },
}));

// Mock scoringEngine
jest.mock('@/lib/scoringEngine', () => ({
  calculateScore: jest.fn().mockReturnValue({
    score: 85,
    recommendation: 'Good',
    breakdown: {
      base_score: 100,
      status_penalty: 0,
      redirect_penalty: 0,
      js_penalty: 0,
      bot_protection_penalty: 15,
      final_score: 85,
    },
  }),
}));

import {
  normalizeURL,
  validateURLs,
  extractDomain,
  groupURLsByDomain,
  generateAuditSummary,
} from '@/lib/auditEngine';
import type { URLAuditResult } from '@/types/audit';

// Mock fetch for testURL
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Audit Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeURL', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeURL('example.com')).toBe('https://example.com/');
      expect(normalizeURL('www.example.com')).toBe('https://www.example.com/');
    });

    it('should preserve existing https:// protocol', () => {
      expect(normalizeURL('https://example.com')).toBe('https://example.com/');
    });

    it('should preserve http:// protocol', () => {
      expect(normalizeURL('http://example.com')).toBe('http://example.com/');
    });

    it('should preserve paths and query strings', () => {
      expect(normalizeURL('example.com/path?query=1')).toBe('https://example.com/path?query=1');
    });

    it('should trim whitespace', () => {
      expect(normalizeURL('  example.com  ')).toBe('https://example.com/');
    });

    it('should throw for empty URLs', () => {
      expect(() => normalizeURL('')).toThrow('Invalid URL');
      expect(() => normalizeURL('   ')).toThrow('Invalid URL');
    });

    it('should handle domain-like strings', () => {
      // These become valid URLs when https:// is prepended
      expect(normalizeURL('not-a-url')).toBe('https://not-a-url/');
    });
  });

  describe('validateURLs', () => {
    it('should separate valid and invalid URLs', () => {
      const urls = [
        'https://example.com',
        'test.com',
        'not a url with spaces',
        'http://valid.com',
      ];

      const result = validateURLs(urls);

      // URLs without TLD-like structure are still parseable, but URLs with spaces are not
      expect(result.invalid).toContain('not a url with spaces');
      expect(result.valid).toContain('https://example.com/');
      expect(result.valid).toContain('https://test.com/');
      expect(result.valid).toContain('http://valid.com/');
    });

    it('should handle empty array', () => {
      const result = validateURLs([]);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });

    it('should normalize valid URLs', () => {
      const urls = ['example.com', 'test.com/path'];

      const result = validateURLs(urls);

      expect(result.valid).toContain('https://example.com/');
      expect(result.valid).toContain('https://test.com/path');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from full URL', () => {
      expect(extractDomain('https://example.com/path?query=1')).toBe('example.com');
      expect(extractDomain('http://www.test.com/page')).toBe('www.test.com');
    });

    it('should handle URLs without protocol', () => {
      expect(extractDomain('example.com')).toBe('example.com');
    });

    it('should preserve subdomains', () => {
      expect(extractDomain('https://sub.example.com/path')).toBe('sub.example.com');
    });

    it('should return input for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url');
    });
  });

  describe('groupURLsByDomain', () => {
    it('should group URLs by domain', () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://test.com/page1',
        'https://example.com/page3',
      ];

      const groups = groupURLsByDomain(urls);

      expect(groups.get('example.com')).toHaveLength(3);
      expect(groups.get('test.com')).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const groups = groupURLsByDomain([]);

      expect(groups.size).toBe(0);
    });

    it('should handle subdomains separately', () => {
      const urls = [
        'https://www.example.com/page',
        'https://api.example.com/endpoint',
        'https://example.com/home',
      ];

      const groups = groupURLsByDomain(urls);

      expect(groups.size).toBe(3);
      expect(groups.get('www.example.com')).toHaveLength(1);
      expect(groups.get('api.example.com')).toHaveLength(1);
      expect(groups.get('example.com')).toHaveLength(1);
    });
  });

  describe('generateAuditSummary', () => {
    const createMockResult = (overrides: Partial<URLAuditResult> = {}): URLAuditResult => ({
      url: 'https://example.com',
      finalUrl: 'https://example.com',
      status: 200,
      accessible: true,
      redirects: [],
      jsRequired: false,
      botProtections: [],
      scrapeLikelihoodScore: 85,
      scoreBreakdown: {
        httpStatus: 40,
        jsRequired: 20,
        htmlResponse: 15,
        botProtection: 15,
        redirectChain: 10,
        total: 100,
      },
      recommendation: 'best_entry_point',
      ...overrides,
    });

    it('should calculate correct summary stats', () => {
      const results: URLAuditResult[] = [
        createMockResult({ url: 'https://a.com', scrapeLikelihoodScore: 90, accessible: true }),
        createMockResult({ url: 'https://b.com', scrapeLikelihoodScore: 70, accessible: true }),
        createMockResult({ url: 'https://c.com', scrapeLikelihoodScore: 50, accessible: false }),
      ];

      const summary = generateAuditSummary(results);

      expect(summary.totalUrls).toBe(3);
      expect(summary.accessibleCount).toBe(2);
      expect(summary.blockedCount).toBe(1);
      expect(summary.averageScore).toBe(80); // (90 + 70) / 2
    });

    it('should identify best entry points', () => {
      const results: URLAuditResult[] = [
        createMockResult({ url: 'https://a.com', scrapeLikelihoodScore: 90, accessible: true }),
        createMockResult({ url: 'https://b.com', scrapeLikelihoodScore: 85, accessible: true }),
        createMockResult({ url: 'https://c.com', scrapeLikelihoodScore: 70, accessible: true }),
        createMockResult({ url: 'https://d.com', scrapeLikelihoodScore: 50, accessible: true }),
      ];

      const summary = generateAuditSummary(results);

      expect(summary.bestEntryPoints).toHaveLength(2); // Score >= 80
      expect(summary.bestEntryPoints[0].scrapeLikelihoodScore).toBe(90);
    });

    it('should count recommendations correctly', () => {
      const results: URLAuditResult[] = [
        createMockResult({ status: 200, recommendation: 'best_entry_point' }),
        createMockResult({ status: 200, recommendation: 'good' }),
        createMockResult({ status: 301, recommendation: 'moderate' }),
        createMockResult({ status: 403, accessible: false, recommendation: 'blocked' }),
      ];

      const summary = generateAuditSummary(results);

      expect(summary.recommendationBreakdown?.best_entry_point).toBe(1);
      expect(summary.recommendationBreakdown?.good).toBe(1);
      expect(summary.recommendationBreakdown?.moderate).toBe(1);
      expect(summary.recommendationBreakdown?.blocked).toBe(1);
    });

    it('should handle empty results', () => {
      const summary = generateAuditSummary([]);

      expect(summary.totalUrls).toBe(0);
      expect(summary.accessibleCount).toBe(0);
      expect(summary.blockedCount).toBe(0);
      expect(summary.averageScore).toBe(0);
      expect(summary.bestEntryPoints).toHaveLength(0);
    });

    it('should limit best entry points to 5', () => {
      const results: URLAuditResult[] = Array(10).fill(null).map((_, i) =>
        createMockResult({
          url: `https://site${i}.com`,
          scrapeLikelihoodScore: 90,
          accessible: true,
        })
      );

      const summary = generateAuditSummary(results);

      expect(summary.bestEntryPoints).toHaveLength(5);
    });

    it('should not include blocked URLs in best entry points', () => {
      const results: URLAuditResult[] = [
        createMockResult({ url: 'https://blocked.com', scrapeLikelihoodScore: 95, accessible: false }),
        createMockResult({ url: 'https://open.com', scrapeLikelihoodScore: 85, accessible: true }),
      ];

      const summary = generateAuditSummary(results);

      expect(summary.bestEntryPoints).toHaveLength(1);
      expect(summary.bestEntryPoints[0].url).toBe('https://open.com');
    });
  });
});
