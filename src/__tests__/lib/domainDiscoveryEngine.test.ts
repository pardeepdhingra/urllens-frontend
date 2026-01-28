// ============================================================================
// URL Lens - Domain Discovery Engine Tests
// ============================================================================

import { filterUrlsByDomain, getUniqueDomains } from '@/lib/domainDiscoveryEngine';
import type { DiscoveredURL } from '@/types/audit';

// Mock fetch for discovery
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock robotsParser
jest.mock('@/lib/robotsParser', () => ({
  parseRobotsTxt: jest.fn().mockResolvedValue({
    exists: false,
    allowed: true,
    sitemaps: [],
    rules: [],
  }),
}));

describe('Domain Discovery Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('filterUrlsByDomain', () => {
    it('should filter URLs to only include target domain', () => {
      const urls: DiscoveredURL[] = [
        { url: 'https://example.com/page1', source: 'sitemap' },
        { url: 'https://example.com/page2', source: 'sitemap' },
        { url: 'https://other.com/page1', source: 'sitemap' },
        { url: 'https://different.org/page1', source: 'sitemap' },
      ];

      const filtered = filterUrlsByDomain(urls, 'example.com');

      expect(filtered).toHaveLength(2);
      expect(filtered.map((u) => u.url)).toContain('https://example.com/page1');
      expect(filtered.map((u) => u.url)).toContain('https://example.com/page2');
    });

    it('should include subdomains of target domain', () => {
      const urls: DiscoveredURL[] = [
        { url: 'https://example.com/page', source: 'sitemap' },
        { url: 'https://www.example.com/page', source: 'sitemap' },
        { url: 'https://blog.example.com/post', source: 'sitemap' },
        { url: 'https://other.com/page', source: 'sitemap' },
      ];

      const filtered = filterUrlsByDomain(urls, 'example.com');

      expect(filtered).toHaveLength(3);
    });

    it('should handle domain with www prefix in target', () => {
      const urls: DiscoveredURL[] = [
        { url: 'https://example.com/page', source: 'sitemap' },
        { url: 'https://www.example.com/page', source: 'sitemap' },
      ];

      // When target includes www, filter to www subdomain
      const filteredWww = filterUrlsByDomain(urls, 'www.example.com');
      expect(filteredWww).toHaveLength(1);
      expect(filteredWww[0].url).toBe('https://www.example.com/page');
    });

    it('should handle empty array', () => {
      const filtered = filterUrlsByDomain([], 'example.com');

      expect(filtered).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const urls: DiscoveredURL[] = [
        { url: 'https://EXAMPLE.COM/page', source: 'sitemap' },
        { url: 'https://Example.Com/other', source: 'sitemap' },
      ];

      const filtered = filterUrlsByDomain(urls, 'example.com');

      expect(filtered).toHaveLength(2);
    });

    it('should skip invalid URLs', () => {
      const urls: DiscoveredURL[] = [
        { url: 'https://example.com/page', source: 'sitemap' },
        { url: 'not-a-url', source: 'sitemap' },
        { url: '', source: 'sitemap' },
      ];

      const filtered = filterUrlsByDomain(urls, 'example.com');

      expect(filtered).toHaveLength(1);
    });
  });

  describe('getUniqueDomains', () => {
    it('should extract unique domains from URLs', () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://test.com/page1',
        'https://other.org/home',
      ];

      const domains = getUniqueDomains(urls);

      expect(domains).toHaveLength(3);
      expect(domains).toContain('example.com');
      expect(domains).toContain('test.com');
      expect(domains).toContain('other.org');
    });

    it('should handle subdomains as separate', () => {
      const urls = [
        'https://example.com/page',
        'https://www.example.com/page',
        'https://api.example.com/endpoint',
      ];

      const domains = getUniqueDomains(urls);

      expect(domains).toHaveLength(3);
      expect(domains).toContain('example.com');
      expect(domains).toContain('www.example.com');
      expect(domains).toContain('api.example.com');
    });

    it('should return lowercase domains', () => {
      const urls = [
        'https://EXAMPLE.COM/page',
        'https://Example.Com/other',
      ];

      const domains = getUniqueDomains(urls);

      expect(domains).toHaveLength(1);
      expect(domains[0]).toBe('example.com');
    });

    it('should handle empty array', () => {
      const domains = getUniqueDomains([]);

      expect(domains).toHaveLength(0);
    });

    it('should skip invalid URLs', () => {
      const urls = [
        'https://example.com/page',
        'not-a-url',
        '',
        'invalid',
      ];

      const domains = getUniqueDomains(urls);

      expect(domains).toHaveLength(1);
      expect(domains[0]).toBe('example.com');
    });
  });
});
