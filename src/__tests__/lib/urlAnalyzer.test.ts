// ============================================================================
// URL Lens - URL Analyzer Tests
// ============================================================================

// Mock cheerio to avoid ESM compatibility issues with Jest
jest.mock('cheerio', () => {
  interface MockElement {
    text: jest.Mock;
    length: number;
    attr: jest.Mock;
    each: jest.Mock;
    find: jest.Mock<MockElement>;
  }

  const createMockElement = (): MockElement => ({
    text: jest.fn(() => ''),
    length: 0,
    attr: jest.fn(() => undefined),
    each: jest.fn(),
    find: jest.fn((): MockElement => createMockElement()),
  });

  const mockCheerio = (_selector: string): MockElement => createMockElement();

  return {
    load: jest.fn((html: string) => {
      const $ = Object.assign(mockCheerio, {
        html: () => html,
        root: () => mockCheerio('root'),
      });
      return $;
    }),
  };
});

import {
  normalizeUrl,
  detectJavaScriptHints,
  detectBotProtections,
} from '@/lib/urlAnalyzer';

describe('URL Analyzer', () => {
  describe('normalizeUrl', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve existing http:// protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should preserve existing https:// protocol', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('should throw error for invalid URLs', () => {
      expect(() => normalizeUrl('not a url')).toThrow('Invalid URL format');
      expect(() => normalizeUrl('')).toThrow('Invalid URL format');
    });

    it('should handle URLs with paths and query strings', () => {
      expect(normalizeUrl('example.com/path?query=1')).toBe(
        'https://example.com/path?query=1'
      );
    });
  });

  describe('detectJavaScriptHints', () => {
    it('should detect noscript warning in HTML', () => {
      const html = `
        <html>
          <body>
            <noscript>
              This website requires JavaScript to function. Please enable JavaScript in your browser settings.
            </noscript>
            <div id="app"></div>
          </body>
        </html>
      `;
      // Create a mock $ function for this test
      const mockTextFn = jest.fn(() => 'This website requires JavaScript');
      const mock$ = jest.fn((selector: string) => ({
        text: mockTextFn,
        length: selector === 'noscript' ? 1 : 0,
      }));

      expect(detectJavaScriptHints(html, mock$ as unknown as ReturnType<typeof import('cheerio').load>)).toBe(true);
    });

    it('should detect Next.js indicators from HTML content', () => {
      const html = `
        <html>
          <body>
            <script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
          </body>
        </html>
      `;
      const mock$ = jest.fn(() => ({ text: jest.fn(() => ''), length: 0 }));

      // The function checks html.includes patterns
      expect(detectJavaScriptHints(html, mock$ as unknown as ReturnType<typeof import('cheerio').load>)).toBe(true);
    });

    it('should detect React app indicators from HTML content', () => {
      const html = `
        <html>
          <body>
            <div id="root" data-reactroot></div>
            <script src="/static/js/main.js"></script>
          </body>
        </html>
      `;
      const mock$ = jest.fn(() => ({ text: jest.fn(() => ''), length: 0 }));

      expect(detectJavaScriptHints(html, mock$ as unknown as ReturnType<typeof import('cheerio').load>)).toBe(true);
    });

    it('should detect Vue.js indicators from HTML content', () => {
      const html = `
        <html>
          <body>
            <div id="app" data-v-app></div>
            <script>new Vue({el: '#app'})</script>
          </body>
        </html>
      `;
      const mock$ = jest.fn(() => ({ text: jest.fn(() => ''), length: 0 }));

      expect(detectJavaScriptHints(html, mock$ as unknown as ReturnType<typeof import('cheerio').load>)).toBe(true);
    });

    it('should return false for static HTML pages with substantial content', () => {
      const html = `
        <html>
          <body>
            <h1>Welcome to our website</h1>
            <p>This is a paragraph with lots of content that demonstrates this is a static page with real content.</p>
            <p>Another paragraph with more content to show this is a fully rendered page.</p>
            <article>
              <h2>Article Title</h2>
              <p>Article content goes here with plenty of text.</p>
            </article>
          </body>
        </html>
      `;
      // Mock $ to return substantial text content
      const longText = 'Welcome to our website This is a paragraph with lots of content ' +
        'that demonstrates this is a static page with real content. Another paragraph ' +
        'with more content to show this is a fully rendered page. Article Title ' +
        'Article content goes here with plenty of text.';

      const mock$ = jest.fn((selector: string) => {
        if (selector === 'body') {
          return { text: () => longText, length: 1 };
        }
        if (selector === 'script') {
          return { text: () => '', length: 2 };
        }
        return { text: () => '', length: 0 };
      });

      expect(detectJavaScriptHints(html, mock$ as unknown as ReturnType<typeof import('cheerio').load>)).toBe(false);
    });
  });

  describe('detectBotProtections', () => {
    it('should detect Cloudflare from headers', () => {
      const html = '<html><body>Hello</body></html>';
      const headers = {
        server: 'cloudflare',
        'cf-ray': '1234567890abcdef-LAX',
      };

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'cloudflare')).toBe(true);
    });

    it('should detect Cloudflare from HTML content', () => {
      const html = `
        <html>
          <body>
            <script src="/cdn-cgi/challenge-platform/scripts/main.js"></script>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'cloudflare')).toBe(true);
    });

    it('should detect reCAPTCHA', () => {
      const html = `
        <html>
          <body>
            <div class="g-recaptcha" data-sitekey="..."></div>
            <script src="https://www.google.com/recaptcha/api.js"></script>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'recaptcha')).toBe(true);
    });

    it('should detect hCaptcha', () => {
      const html = `
        <html>
          <body>
            <div class="h-captcha" data-sitekey="..."></div>
            <script src="https://hcaptcha.com/1/api.js"></script>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'hcaptcha')).toBe(true);
    });

    it('should detect DataDome', () => {
      const html = '<html><body>Hello</body></html>';
      const headers = {
        'x-datadome': 'protected',
      };

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'datadome')).toBe(true);
    });

    it('should detect Akamai', () => {
      const html = `
        <html>
          <body>
            <script src="/_bm/akamai.js"></script>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'akamai')).toBe(true);
    });

    it('should detect Imperva/Incapsula', () => {
      const html = `
        <html>
          <body>
            <script>var visid_incap = "...";</script>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'imperva')).toBe(true);
    });

    it('should detect rate limiting headers', () => {
      const html = '<html><body>Hello</body></html>';
      const headers = {
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
      };

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'rate_limiting')).toBe(true);
    });

    it('should detect fingerprinting', () => {
      const html = `
        <html>
          <body>
            <script src="/fingerprintjs/fp.min.js"></script>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      expect(protections.some((p) => p.type === 'fingerprinting')).toBe(true);
    });

    it('should return empty array for clean page', () => {
      const html = `
        <html>
          <body>
            <h1>Welcome</h1>
            <p>This is a simple page.</p>
          </body>
        </html>
      `;
      const headers = {
        'content-type': 'text/html',
      };

      const protections = detectBotProtections(html, headers);
      expect(protections).toHaveLength(0);
    });

    it('should not duplicate same protection type', () => {
      const html = `
        <html>
          <body>
            <div class="g-recaptcha"></div>
            <script src="https://www.google.com/recaptcha/api.js"></script>
            <div data-grecaptcha></div>
          </body>
        </html>
      `;
      const headers = {};

      const protections = detectBotProtections(html, headers);
      const recaptchaCount = protections.filter((p) => p.type === 'recaptcha').length;
      expect(recaptchaCount).toBe(1);
    });
  });
});
