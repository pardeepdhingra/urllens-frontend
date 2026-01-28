// ============================================================================
// URL Lens - Social Preview Analyzer Tests
// ============================================================================

// Mock cheerio before imports
jest.mock('cheerio', () => {
  const mockCheerio = (html: string) => {
    const getAttr = (selector: string, attr: string) => {
      const regex = new RegExp(`<[^>]*${selector.replace(/[[\]"=]/g, '.')}[^>]*${attr}=["']([^"']+)["']`, 'i');
      const match = html.match(regex);
      return match ? match[1] : undefined;
    };

    const getText = (selector: string) => {
      const regex = new RegExp(`<${selector}[^>]*>([^<]+)</${selector}>`, 'i');
      const match = html.match(regex);
      return match ? match[1] : '';
    };

    const $ = (selector: string) => ({
      attr: (name: string) => {
        if (selector.includes('meta')) return getAttr(selector, name);
        if (selector.includes('link')) return getAttr(selector, name);
        return undefined;
      },
      text: () => getText(selector.replace(/[[\]]/g, '')),
      each: (fn: (index: number, el: unknown) => void) => {
        const matches = html.match(new RegExp(`<meta[^>]*${selector.replace('meta', '').replace(/[[\]"=]/g, '.')}[^>]*>`, 'gi')) || [];
        matches.forEach((_, i) => fn(i, {}));
      },
    });

    $.load = () => $;
    return $;
  };

  return {
    load: (html: string) => mockCheerio(html),
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after setting up mocks
import {
  analyzeSocialPreview,
  PLATFORM_RULES,
} from '@/lib/socialPreviewAnalyzer';

describe('Social Preview Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PLATFORM_RULES', () => {
    it('should have correct Facebook rules', () => {
      expect(PLATFORM_RULES.facebook.titleMaxLength).toBe(88);
      expect(PLATFORM_RULES.facebook.descriptionMaxLength).toBe(200);
      expect(PLATFORM_RULES.facebook.imageMinWidth).toBe(600);
      expect(PLATFORM_RULES.facebook.aspectRatio).toBe(1.91);
    });

    it('should have correct LinkedIn rules', () => {
      expect(PLATFORM_RULES.linkedin.titleMaxLength).toBe(70);
      expect(PLATFORM_RULES.linkedin.descriptionMaxLength).toBe(150);
    });

    it('should have correct Google rules', () => {
      expect(PLATFORM_RULES.google.titleMaxLength).toBe(60);
      expect(PLATFORM_RULES.google.titleMinLength).toBe(50);
      expect(PLATFORM_RULES.google.descriptionMaxLength).toBe(160);
    });

    it('should have correct Twitter rules', () => {
      expect(PLATFORM_RULES.twitter.titleMaxLength).toBe(70);
      expect(PLATFORM_RULES.twitter.descriptionMaxLength).toBe(200);
    });

    it('should have correct WhatsApp rules', () => {
      expect(PLATFORM_RULES.whatsapp.titleMaxLength).toBe(65);
      expect(PLATFORM_RULES.whatsapp.descriptionMaxLength).toBe(150);
    });

    it('should have correct Telegram rules', () => {
      expect(PLATFORM_RULES.telegram.titleMaxLength).toBe(80);
      expect(PLATFORM_RULES.telegram.descriptionMaxLength).toBe(160);
    });
  });

  describe('analyzeSocialPreview', () => {
    const mockHtmlWithAllMeta = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page Title</title>
          <meta name="description" content="This is a test page description">
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/og-image.jpg">
          <meta property="og:url" content="https://example.com/page">
          <meta name="twitter:title" content="Twitter Title">
          <meta name="twitter:description" content="Twitter Description">
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
          <meta name="twitter:card" content="summary_large_image">
          <link rel="canonical" href="https://example.com/canonical">
        </head>
        <body></body>
      </html>
    `;

    const createMockResponse = (html: string, url: string = 'https://example.com') => ({
      ok: true,
      url,
      headers: new Map([['content-type', 'text/html']]),
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(html),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: jest.fn(),
        }),
      },
    });

    it('should normalize URL without protocol', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtmlWithAllMeta));
      mockFetch.mockResolvedValue({ ok: true, headers: new Map([['content-length', '50000']]) });

      const result = await analyzeSocialPreview('example.com');
      expect(result.url).toBe('https://example.com');
    });

    it('should extract all metadata when available', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtmlWithAllMeta));
      mockFetch.mockResolvedValue({ ok: true, headers: new Map([['content-length', '50000']]) });

      const result = await analyzeSocialPreview('https://example.com');

      expect(result.metadata.raw.ogTitle).toBe('OG Title');
      expect(result.metadata.raw.ogDescription).toBe('OG Description');
      expect(result.metadata.raw.ogImage).toBe('https://example.com/og-image.jpg');
      expect(result.metadata.raw.twitterTitle).toBe('Twitter Title');
      expect(result.metadata.raw.twitterDescription).toBe('Twitter Description');
      expect(result.metadata.raw.title).toBe('Test Page Title');
      expect(result.metadata.raw.description).toBe('This is a test page description');
    });

    it('should throw error for non-HTML response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
      });

      await expect(analyzeSocialPreview('https://example.com/api')).rejects.toThrow(
        'Response is not HTML'
      );
    });

    it('should throw error for failed HTTP request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(analyzeSocialPreview('https://example.com/notfound')).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      await expect(analyzeSocialPreview('https://slow-site.com')).rejects.toThrow();
    });
  });

  describe('Platform Previews', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Title That Is Quite Long And Should Be Truncated Eventually</title>
          <meta name="description" content="A longer description that provides more context about the page content.">
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/image.jpg">
        </head>
        <body></body>
      </html>
    `;

    const createMockResponse = (html: string, url: string = 'https://example.com') => ({
      ok: true,
      url,
      headers: new Map([['content-type', 'text/html']]),
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(html),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: jest.fn(),
        }),
      },
    });

    it('should generate Facebook preview with warnings for missing og:title', async () => {
      const htmlNoOg = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Page Title</title>
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(htmlNoOg));

      const result = await analyzeSocialPreview('https://example.com');

      const facebookWarnings = result.platforms.facebook.warnings;
      expect(facebookWarnings.some(w => w.message.includes('og:title'))).toBe(true);
      expect(facebookWarnings.some(w => w.message.includes('og:image'))).toBe(true);
    });

    it('should generate Google preview using standard HTML tags', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtml));
      mockFetch.mockResolvedValue({ ok: true, headers: new Map([['content-length', '100000']]) });

      const result = await analyzeSocialPreview('https://example.com');
      expect(result.platforms.google.title).toContain('Test Title');
    });

    it('should generate Twitter preview preferring twitter: tags', async () => {
      const htmlWithTwitter = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="OG Title">
            <meta name="twitter:title" content="Twitter Specific Title">
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(htmlWithTwitter));

      const result = await analyzeSocialPreview('https://example.com');
      expect(result.platforms.twitter.title).toBe('Twitter Specific Title');
    });

    it('should truncate titles exceeding platform limits', async () => {
      const longTitle = 'A'.repeat(200);
      const htmlLongTitle = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="${longTitle}">
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(htmlLongTitle));

      const result = await analyzeSocialPreview('https://example.com');

      expect(result.platforms.facebook.title.length).toBeLessThanOrEqual(91);
      expect(result.platforms.facebook.title.endsWith('...')).toBe(true);
    });

    it('should include displayUrl for all platforms', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtml));
      mockFetch.mockResolvedValue({ ok: true, headers: new Map([['content-length', '100000']]) });

      const result = await analyzeSocialPreview('https://example.com');

      expect(result.platforms.facebook.displayUrl).toBeDefined();
      expect(result.platforms.linkedin.displayUrl).toBeDefined();
      expect(result.platforms.google.displayUrl).toBeDefined();
      expect(result.platforms.twitter.displayUrl).toBeDefined();
      expect(result.platforms.whatsapp.displayUrl).toBeDefined();
      expect(result.platforms.telegram.displayUrl).toBeDefined();
    });
  });

  describe('Image Validation', () => {
    const createMockResponse = (html: string, url: string = 'https://example.com') => ({
      ok: true,
      url,
      headers: new Map([['content-type', 'text/html']]),
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(html),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: jest.fn(),
        }),
      },
    });

    it('should validate image and get size', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:image" content="https://example.com/image.jpg">
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtml));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-length', '153600']]),
      });

      const result = await analyzeSocialPreview('https://example.com');

      expect(result.metadata.images.length).toBeGreaterThan(0);
      if (result.metadata.images[0].size_kb) {
        expect(result.metadata.images[0].size_kb).toBe(150);
      }
    });

    it('should handle failed image validation gracefully', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:image" content="https://example.com/broken-image.jpg">
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtml));
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await analyzeSocialPreview('https://example.com');
      expect(result.metadata.raw.ogImage).toBe('https://example.com/broken-image.jpg');
    });
  });

  describe('URL Normalization', () => {
    const createMockResponse = (html: string, url: string = 'https://example.com') => ({
      ok: true,
      url,
      headers: new Map([['content-type', 'text/html']]),
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(html),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: jest.fn(),
        }),
      },
    });

    it('should resolve relative image URLs', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:image" content="/images/og.jpg">
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtml, 'https://example.com/page'));
      mockFetch.mockResolvedValue({ ok: true, headers: new Map([['content-length', '50000']]) });

      const result = await analyzeSocialPreview('https://example.com/page');
      expect(result.metadata.raw.ogImage).toBe('https://example.com/images/og.jpg');
    });

    it('should format display URLs correctly', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test</title>
          </head>
          <body></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce(createMockResponse(mockHtml, 'https://www.example.com/very/long/path'));

      const result = await analyzeSocialPreview('https://www.example.com/very/long/path');
      expect(result.platforms.facebook.displayUrl).not.toContain('www.');
    });
  });
});
