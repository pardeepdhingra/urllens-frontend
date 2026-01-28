// ============================================================================
// URL Lens - UTM Analyzer Tests
// ============================================================================

import {
  parseUrlParams,
  extractUtmParams,
  extractTrackingParams,
  compareParams,
  hasUtmParams,
  areUtmParamsPreserved,
  analyzeParameterFlow,
  formatUrlWithParams,
  getUtmAnalysisSummary,
} from '@/lib/utmAnalyzer';

describe('UTM Analyzer', () => {
  describe('parseUrlParams', () => {
    it('should parse URL query parameters correctly', () => {
      const params = parseUrlParams('https://example.com?foo=bar&baz=qux');
      expect(params).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should parse UTM parameters', () => {
      const params = parseUrlParams(
        'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer'
      );
      expect(params.utm_source).toBe('google');
      expect(params.utm_medium).toBe('cpc');
      expect(params.utm_campaign).toBe('summer');
    });

    it('should handle URLs without parameters', () => {
      const params = parseUrlParams('https://example.com/path');
      expect(params).toEqual({});
    });

    it('should handle invalid URLs gracefully', () => {
      const params = parseUrlParams('not-a-url');
      expect(params).toEqual({});
    });

    it('should handle URL-encoded values', () => {
      const params = parseUrlParams('https://example.com?q=hello%20world');
      expect(params.q).toBe('hello world');
    });
  });

  describe('extractUtmParams', () => {
    it('should extract only UTM parameters', () => {
      const allParams = {
        utm_source: 'google',
        utm_medium: 'cpc',
        foo: 'bar',
        fbclid: '123',
      };
      const utmParams = extractUtmParams(allParams);

      expect(utmParams).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
      });
      expect(utmParams.foo).toBeUndefined();
      expect(utmParams.fbclid).toBeUndefined();
    });

    it('should return empty object when no UTM params', () => {
      const utmParams = extractUtmParams({ foo: 'bar', baz: 'qux' });
      expect(utmParams).toEqual({});
    });

    it('should extract all UTM parameter types', () => {
      const allParams = {
        utm_source: 'newsletter',
        utm_medium: 'email',
        utm_campaign: 'spring_sale',
        utm_content: 'cta_button',
        utm_term: 'shoes',
        utm_id: '12345',
      };
      const utmParams = extractUtmParams(allParams);
      expect(Object.keys(utmParams)).toHaveLength(6);
    });
  });

  describe('extractTrackingParams', () => {
    it('should extract UTM and other tracking parameters', () => {
      const allParams = {
        utm_source: 'google',
        fbclid: 'fb123',
        gclid: 'gc456',
        foo: 'bar',
      };
      const trackingParams = extractTrackingParams(allParams);

      expect(trackingParams.utm_source).toBe('google');
      expect(trackingParams.fbclid).toBe('fb123');
      expect(trackingParams.gclid).toBe('gc456');
      expect(trackingParams.foo).toBeUndefined();
    });
  });

  describe('compareParams', () => {
    it('should identify preserved parameters', () => {
      const before = { foo: 'bar' };
      const after = { foo: 'bar' };
      const changes = compareParams(before, after);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        name: 'foo',
        action: 'preserved',
        originalValue: 'bar',
        newValue: 'bar',
      });
    });

    it('should identify removed parameters', () => {
      const before = { foo: 'bar', baz: 'qux' };
      const after = { foo: 'bar' };
      const changes = compareParams(before, after);

      const removed = changes.find(c => c.name === 'baz');
      expect(removed).toEqual({
        name: 'baz',
        action: 'removed',
        originalValue: 'qux',
      });
    });

    it('should identify added parameters', () => {
      const before = { foo: 'bar' };
      const after = { foo: 'bar', baz: 'qux' };
      const changes = compareParams(before, after);

      const added = changes.find(c => c.name === 'baz');
      expect(added).toEqual({
        name: 'baz',
        action: 'added',
        newValue: 'qux',
      });
    });

    it('should identify modified parameters', () => {
      const before = { foo: 'bar' };
      const after = { foo: 'baz' };
      const changes = compareParams(before, after);

      expect(changes[0]).toEqual({
        name: 'foo',
        action: 'modified',
        originalValue: 'bar',
        newValue: 'baz',
      });
    });
  });

  describe('hasUtmParams', () => {
    it('should return true when UTM params exist', () => {
      expect(hasUtmParams({ utm_source: 'google' })).toBe(true);
      expect(hasUtmParams({ utm_medium: 'cpc', foo: 'bar' })).toBe(true);
    });

    it('should return false when no UTM params', () => {
      expect(hasUtmParams({})).toBe(false);
      expect(hasUtmParams({ foo: 'bar', fbclid: '123' })).toBe(false);
    });
  });

  describe('areUtmParamsPreserved', () => {
    it('should return true when UTM params are preserved', () => {
      const initial = { utm_source: 'google', utm_medium: 'cpc' };
      const final = { utm_source: 'google', utm_medium: 'cpc', foo: 'bar' };

      expect(areUtmParamsPreserved(initial, final)).toBe(true);
    });

    it('should return false when UTM param is removed', () => {
      const initial = { utm_source: 'google', utm_medium: 'cpc' };
      const final = { utm_source: 'google' };

      expect(areUtmParamsPreserved(initial, final)).toBe(false);
    });

    it('should return false when UTM param is modified', () => {
      const initial = { utm_source: 'google' };
      const final = { utm_source: 'facebook' };

      expect(areUtmParamsPreserved(initial, final)).toBe(false);
    });

    it('should return true when no initial UTM params', () => {
      expect(areUtmParamsPreserved({}, { foo: 'bar' })).toBe(true);
    });
  });

  describe('analyzeParameterFlow', () => {
    it('should handle empty URL array', () => {
      const result = analyzeParameterFlow([]);

      expect(result.hasUtmParams).toBe(false);
      expect(result.utmPreserved).toBe(true);
      expect(result.parameterFlow).toHaveLength(0);
    });

    it('should track UTM parameters through redirects', () => {
      const urls = [
        'https://link.example.com?utm_source=email&utm_campaign=test',
        'https://example.com?utm_source=email&utm_campaign=test',
      ];

      const result = analyzeParameterFlow(urls);

      expect(result.hasUtmParams).toBe(true);
      expect(result.utmPreserved).toBe(true);
      expect(result.parameterFlow).toHaveLength(2);
    });

    it('should detect lost UTM parameters', () => {
      const urls = [
        'https://link.example.com?utm_source=email&utm_campaign=test',
        'https://example.com/landing', // UTMs lost
      ];

      const result = analyzeParameterFlow(urls);

      expect(result.hasUtmParams).toBe(true);
      expect(result.utmPreserved).toBe(false);
      expect(result.paramsRemoved).toContain('utm_source');
      expect(result.paramsRemoved).toContain('utm_campaign');
      expect(result.issues.some(i => i.severity === 'error')).toBe(true);
    });

    it('should detect when UTM params are lost at specific step', () => {
      const urls = [
        'https://a.com?utm_source=test',
        'https://b.com?utm_source=test',
        'https://c.com', // Lost here (step 3)
      ];

      const result = analyzeParameterFlow(urls);

      expect(result.utmLostAt).toBe(3);
    });

    it('should track added parameters', () => {
      const urls = [
        'https://example.com',
        'https://example.com?session_id=abc123',
      ];

      const result = analyzeParameterFlow(urls);

      expect(result.paramsAdded).toContain('session_id');
    });

    it('should generate appropriate issues', () => {
      const urls = [
        'https://example.com?utm_source=google&fbclid=123',
        'https://example.com?utm_source=facebook', // Modified and removed
      ];

      const result = analyzeParameterFlow(urls);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.affectedParams.includes('utm_source'))).toBe(true);
    });
  });

  describe('formatUrlWithParams', () => {
    it('should separate base URL and parameters', () => {
      const result = formatUrlWithParams(
        'https://example.com/path?utm_source=google&foo=bar'
      );

      expect(result.base).toBe('https://example.com/path');
      expect(result.params).toHaveLength(2);
    });

    it('should identify UTM parameters', () => {
      const result = formatUrlWithParams(
        'https://example.com?utm_source=google&foo=bar'
      );

      const utmParam = result.params.find(p => p.key === 'utm_source');
      const otherParam = result.params.find(p => p.key === 'foo');

      expect(utmParam?.isUtm).toBe(true);
      expect(otherParam?.isUtm).toBe(false);
    });

    it('should handle invalid URLs', () => {
      const result = formatUrlWithParams('not-a-url');

      expect(result.base).toBe('not-a-url');
      expect(result.params).toHaveLength(0);
    });
  });

  describe('getUtmAnalysisSummary', () => {
    it('should generate appropriate summary for preserved UTMs', () => {
      const result = analyzeParameterFlow([
        'https://example.com?utm_source=test',
        'https://example.com/page?utm_source=test',
      ]);

      const summary = getUtmAnalysisSummary(result);

      expect(summary).toContain('preserved');
    });

    it('should generate appropriate summary for lost UTMs', () => {
      const result = analyzeParameterFlow([
        'https://example.com?utm_source=test',
        'https://example.com/page',
      ]);

      const summary = getUtmAnalysisSummary(result);

      expect(summary).toContain('lost');
    });

    it('should generate appropriate summary when no UTMs', () => {
      const result = analyzeParameterFlow([
        'https://example.com',
        'https://example.com/page',
      ]);

      const summary = getUtmAnalysisSummary(result);

      expect(summary).toContain('No UTM');
    });
  });
});
