// ============================================================================
// URL Lens - Social Preview Analyzer Tests
// ============================================================================

// Mock jsdom before importing the module
jest.mock('jsdom', () => {
  class MockWindow {
    document: MockDocument;
    constructor() {
      this.document = new MockDocument();
    }
  }

  class MockDocument {
    private elements: Map<string, MockElement[]> = new Map();
    private html: string = '';

    setHtml(html: string) {
      this.html = html;
      this.parseHtml();
    }

    private parseHtml() {
      // Clear existing elements
      this.elements.clear();

      // Parse meta tags
      const metaRegex = /<meta\s+([^>]+)>/gi;
      let match;
      while ((match = metaRegex.exec(this.html)) !== null) {
        const attrs = match[1];
        const element = new MockElement('meta');

        // Parse attributes
        const attrRegex = /(\w+)=["']([^"']+)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          element.setAttribute(attrMatch[1], attrMatch[2]);
        }

        // Store by various selectors
        const property = element.getAttribute('property');
        const name = element.getAttribute('name');

        if (property) {
          this.addElement(`meta[property="${property}"]`, element);
        }
        if (name) {
          this.addElement(`meta[name="${name}"]`, element);
        }
      }

      // Parse title
      const titleMatch = this.html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        const titleElement = new MockElement('title');
        titleElement.textContent = titleMatch[1];
        this.addElement('title', titleElement);
      }

      // Parse canonical link
      const canonicalMatch = this.html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i);
      if (canonicalMatch) {
        const linkElement = new MockElement('link');
        linkElement.setAttribute('rel', 'canonical');
        linkElement.setAttribute('href', canonicalMatch[1]);
        this.addElement('link[rel="canonical"]', linkElement);
      }
    }

    private addElement(selector: string, element: MockElement) {
      if (!this.elements.has(selector)) {
        this.elements.set(selector, []);
      }
      this.elements.get(selector)!.push(element);
    }

    querySelector(selector: string): MockElement | null {
      const elements = this.elements.get(selector);
      return elements && elements.length > 0 ? elements[0] : null;
    }

    querySelectorAll(selector: string): MockElement[] {
      return this.elements.get(selector) || [];
    }
  }

  class MockElement {
    private attributes: Map<string, string> = new Map();
    public textContent: string | null = null;
    public tagName: string;

    constructor(tagName: string) {
      this.tagName = tagName;
    }

    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    }

    getAttribute(name: string): string | null {
      return this.attributes.get(name) ?? null;
    }
  }

  return {
    JSDOM: class {
      window: MockWindow;
      constructor(html: string) {
        this.window = new MockWindow();
        this.window.document.setHtml(html);
      }
    },
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocking
import {
  analyzeSocialPreview,
  PLATFORM_RULES,
  SocialPreviewResult,
  RawMetadata,
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

    const mockHtmlMinimal = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Minimal Page</title>
        </head>
        <body></body>
      </html>
    `;

    it('should normalize URL without protocol', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtmlWithAllMeta),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      // Mock HEAD request for image validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-length', '50000']]),
      });

      const result = await analyzeSocialPreview('example.com');

      expect(result.url).toBe('https://example.com');
    });

    it('should extract all metadata when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtmlWithAllMeta),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '50000']]),
      });

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
          <meta name="description" content="A longer description that provides more context about the page content and might need truncation depending on the platform.">
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/image.jpg">
        </head>
        <body></body>
      </html>
    `;

    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtml),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '100000']]),
      });
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

      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(htmlNoOg),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      const result = await analyzeSocialPreview('https://example.com');

      const facebookWarnings = result.platforms.facebook.warnings;
      expect(facebookWarnings.some(w => w.message.includes('og:title'))).toBe(true);
      expect(facebookWarnings.some(w => w.message.includes('og:image'))).toBe(true);
    });

    it('should generate Google preview using standard HTML tags', async () => {
      const result = await analyzeSocialPreview('https://example.com');

      // Google should use <title> not og:title
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

      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(htmlWithTwitter),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

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

      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(htmlLongTitle),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      const result = await analyzeSocialPreview('https://example.com');

      // Facebook title should be truncated to 88 chars (+ "...")
      expect(result.platforms.facebook.title.length).toBeLessThanOrEqual(91);
      expect(result.platforms.facebook.title.endsWith('...')).toBe(true);
    });

    it('should include displayUrl for all platforms', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtml),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      // Image HEAD request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-length', '153600']]), // 150KB
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtml),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      // Image HEAD request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await analyzeSocialPreview('https://example.com');

      // Should still have the image URL in metadata
      expect(result.metadata.raw.ogImage).toBe('https://example.com/broken-image.jpg');
    });
  });

  describe('URL Normalization', () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://example.com/page',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtml),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '50000']]),
      });

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        url: 'https://www.example.com/very/long/path/to/page',
        headers: new Map([['content-type', 'text/html']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockHtml),
              })
              .mockResolvedValueOnce({ done: true }),
            cancel: jest.fn(),
          }),
        },
      });

      const result = await analyzeSocialPreview('https://www.example.com/very/long/path/to/page');

      // Display URL should not have www prefix
      expect(result.platforms.facebook.displayUrl).not.toContain('www.');
    });
  });
});
