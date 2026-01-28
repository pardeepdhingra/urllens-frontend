// ============================================================================
// URL Lens - CSV Parser Tests
// ============================================================================

import { parseCSV, parseURLList, resultsToCSV } from '@/lib/csvParser';

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse basic CSV with URLs', () => {
      const content = `https://example.com
https://test.com
https://demo.com`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(3);
      expect(result.urls).toContain('https://example.com/');
      expect(result.urls).toContain('https://test.com/');
      expect(result.urls).toContain('https://demo.com/');
      expect(result.invalidLines).toHaveLength(0);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('should handle comma-delimited CSV with quoted URLs', () => {
      const content = `url,name
"https://example.com","Example"
"https://test.com","Test"`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/');
      expect(result.urls).toContain('https://test.com/');
    });

    it('should skip header rows', () => {
      const content = `URL
https://example.com
https://test.com`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
      expect(result.urls.some(u => u.toLowerCase().includes('url'))).toBe(false);
    });

    it('should remove duplicate URLs', () => {
      const content = `https://example.com
https://example.com
https://test.com
https://test.com
https://test.com`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
      expect(result.duplicatesRemoved).toBe(3);
    });

    it('should track invalid lines', () => {
      const content = `https://example.com
not a valid url
https://test.com
invalid line here`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
      expect(result.invalidLines).toHaveLength(2);
    });

    it('should add https:// to URLs without protocol', () => {
      const content = `example.com
www.test.com`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/');
      expect(result.urls).toContain('https://www.test.com/');
    });

    it('should handle Windows line endings', () => {
      const content = "https://example.com\r\nhttps://test.com\r\nhttps://demo.com";

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(3);
    });

    it('should handle semicolon delimiters', () => {
      const content = `url;name
https://example.com;Example
https://test.com;Test`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
    });

    it('should handle tab delimiters', () => {
      const content = `url\tname
https://example.com\tExample
https://test.com\tTest`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
    });

    it('should handle quoted values', () => {
      const content = `"https://example.com","Example Site"
"https://test.com","Test Site"`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
    });

    it('should skip empty lines', () => {
      const content = `https://example.com

https://test.com

`;

      const result = parseCSV(content);

      expect(result.urls).toHaveLength(2);
    });
  });

  describe('parseURLList', () => {
    it('should parse newline-separated URLs', () => {
      const input = `https://example.com
https://test.com
https://demo.com`;

      const result = parseURLList(input);

      expect(result.urls).toHaveLength(3);
    });

    it('should parse comma-separated URLs', () => {
      const input = 'https://example.com, https://test.com, https://demo.com';

      const result = parseURLList(input);

      expect(result.urls).toHaveLength(3);
    });

    it('should handle mixed delimiters', () => {
      const input = `https://example.com, https://test.com
https://demo.com, https://final.com`;

      const result = parseURLList(input);

      expect(result.urls).toHaveLength(4);
    });

    it('should handle space-separated URLs on same line', () => {
      const input = 'https://example.com https://test.com https://demo.com';

      const result = parseURLList(input);

      expect(result.urls).toHaveLength(3);
    });

    it('should remove duplicates', () => {
      const input = 'https://example.com, https://example.com, https://test.com';

      const result = parseURLList(input);

      expect(result.urls).toHaveLength(2);
      expect(result.duplicatesRemoved).toBe(1);
    });

    it('should add protocol to URLs without one', () => {
      const input = 'example.com, test.com';

      const result = parseURLList(input);

      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/');
    });
  });

  describe('resultsToCSV', () => {
    it('should convert results to CSV format', () => {
      const results = [
        { url: 'https://example.com', score: 85, accessible: true },
        { url: 'https://test.com', score: 70, accessible: false },
      ];

      const columns = [
        { key: 'url' as const, header: 'URL' },
        { key: 'score' as const, header: 'Score' },
        { key: 'accessible' as const, header: 'Accessible' },
      ];

      const csv = resultsToCSV(results, columns);

      expect(csv).toContain('URL,Score,Accessible');
      expect(csv).toContain('https://example.com,85,true');
      expect(csv).toContain('https://test.com,70,false');
    });

    it('should escape fields with commas', () => {
      const results = [
        { url: 'https://example.com', description: 'Hello, World' },
      ];

      const columns = [
        { key: 'url' as const, header: 'URL' },
        { key: 'description' as const, header: 'Description' },
      ];

      const csv = resultsToCSV(results, columns);

      expect(csv).toContain('"Hello, World"');
    });

    it('should escape fields with quotes', () => {
      const results = [
        { url: 'https://example.com', description: 'He said "hello"' },
      ];

      const columns = [
        { key: 'url' as const, header: 'URL' },
        { key: 'description' as const, header: 'Description' },
      ];

      const csv = resultsToCSV(results, columns);

      expect(csv).toContain('"He said ""hello"""');
    });
  });
});
