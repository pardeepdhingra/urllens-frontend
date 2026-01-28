// ============================================================================
// URL Lens - SEO Analyzer Tests
// ============================================================================

// Mock cheerio to avoid ESM compatibility issues with Jest
jest.mock('cheerio', () => {
  interface MockElement {
    text: jest.Mock;
    first: jest.Mock;
    length: number;
    attr: jest.Mock;
    each: jest.Mock;
    find: jest.Mock<MockElement>;
    parent: jest.Mock;
    contents: jest.Mock;
    toArray: jest.Mock;
    filter: jest.Mock;
    map: jest.Mock;
  }

  const createMockElement = (): MockElement => {
    const mockEl: MockElement = {
      text: jest.fn(() => 'Mock text content'),
      first: jest.fn(),
      length: 1,
      attr: jest.fn(() => undefined),
      each: jest.fn((callback: (i: number, el: unknown) => void) => {
        callback(0, {});
      }),
      find: jest.fn(),
      parent: jest.fn(),
      contents: jest.fn(() => []),
      toArray: jest.fn(() => []),
      filter: jest.fn(),
      map: jest.fn(() => ({ get: () => [] })),
    };
    mockEl.first = jest.fn(() => mockEl);
    mockEl.find = jest.fn(() => createMockElement());
    mockEl.parent = jest.fn(() => mockEl);
    mockEl.filter = jest.fn(() => mockEl);
    return mockEl;
  };

  const mockCheerio = (_selector: string): MockElement => {
    const el = createMockElement();
    // Return appropriate content based on selector
    if (_selector === 'title') {
      el.text = jest.fn(() => 'Test Page Title');
    } else if (_selector === 'meta[name="description"]') {
      el.attr = jest.fn(() => 'Test meta description');
    } else if (_selector === 'h1') {
      el.length = 1;
      el.text = jest.fn(() => 'Main Heading');
    } else if (_selector === 'script[type="application/ld+json"]') {
      el.length = 0;
      el.each = jest.fn();
    }
    return el;
  };

  return {
    load: jest.fn((_html: string) => {
      const $ = Object.assign(mockCheerio, {
        html: () => _html,
        root: () => mockCheerio('root'),
      });
      return $;
    }),
  };
});

import {
  getSEOAnalysisSummary,
  getCategoryLabel,
  getScoreStatusEmoji,
  getPriorityEmoji,
} from '@/lib/seoAnalyzer';
import type { SEOAnalysisResult, SEOScore, AEOScore, GEOScore, LLMOScore } from '@/types/seo';

// Helper to create mock SEO analysis result
const createMockSEOResult = (overrides: Partial<{
  seoScore: number;
  aeoScore: number;
  geoScore: number;
  llmoScore: number;
  recommendations: Array<{ priority: string }>;
}>= {}): SEOAnalysisResult => ({
  seo: {
    score: overrides.seoScore ?? 75,
    grade: 'B',
    maxScore: 100,
    breakdown: [],
    issues: [],
  } as SEOScore,
  aeo: {
    score: overrides.aeoScore ?? 60,
    grade: 'C',
    maxScore: 100,
    breakdown: [],
    issues: [],
  } as AEOScore,
  geo: {
    score: overrides.geoScore ?? 80,
    grade: 'B',
    maxScore: 100,
    breakdown: [],
    issues: [],
  } as GEOScore,
  llmo: {
    score: overrides.llmoScore ?? 55,
    grade: 'C',
    maxScore: 100,
    breakdown: [],
    issues: [],
  } as LLMOScore,
  htmlAnalysis: {
    title: 'Test Page',
    metaDescription: 'Test description',
    h1Count: 1,
    h1Text: ['Test'],
    canonical: null,
    langAttribute: 'en',
    hasViewport: true,
    imageCount: 0,
    imagesWithAlt: 0,
    linkCount: 0,
    internalLinks: 0,
    externalLinks: 0,
    wordCount: 100,
    headingStructure: [],
    semanticElements: { hasMain: true, hasNav: true, hasHeader: true, hasFooter: true, hasArticle: true },
    openGraph: {},
    twitter: {},
  },
  structuredData: {
    hasStructuredData: false,
    schemas: [],
    issues: [],
  },
  contentQuality: {
    readabilityScore: 70,
    avgSentenceLength: 15,
    avgWordLength: 5,
    hasLists: false,
    hasTables: false,
    hasCodeBlocks: false,
    questionCount: 0,
    headingToContentRatio: 0.1,
    keyPhrases: [],
    contentLength: 'adequate',
  },
  recommendations: overrides.recommendations?.map((r, i) => ({
    id: `rec-${i}`,
    category: 'seo' as const,
    priority: r.priority as 'critical' | 'high' | 'medium' | 'low',
    title: `Recommendation ${i}`,
    description: 'Test recommendation',
    pointsGain: 5,
  })) ?? [],
  url: 'https://example.com',
  analyzedAt: new Date().toISOString(),
  analysisVersion: '1.0.0',
  analysisDurationMs: 100,
});

describe('SEO Analyzer', () => {
  describe('getSEOAnalysisSummary', () => {
    it('should return correct summary with lowest and highest scores', () => {
      const result = createMockSEOResult({
        seoScore: 75,
        aeoScore: 60,
        geoScore: 80,
        llmoScore: 55,
      });
      const summary = getSEOAnalysisSummary(result);

      expect(summary.lowestScore.score).toBe(55);
      expect(summary.lowestScore.category).toBe('LLMO');
      expect(summary.highestScore.score).toBe(80);
      expect(summary.highestScore.category).toBe('GEO');
    });

    it('should count critical issues correctly', () => {
      const result = createMockSEOResult({
        recommendations: [
          { priority: 'critical' },
          { priority: 'critical' },
          { priority: 'high' },
          { priority: 'medium' },
        ],
      });
      const summary = getSEOAnalysisSummary(result);

      expect(summary.criticalIssues).toBe(2);
      expect(summary.totalIssues).toBe(4);
    });

    it('should handle empty recommendations', () => {
      const result = createMockSEOResult({ recommendations: [] });
      const summary = getSEOAnalysisSummary(result);

      expect(summary.criticalIssues).toBe(0);
      expect(summary.totalIssues).toBe(0);
    });
  });

  describe('getCategoryLabel', () => {
    it('should return correct labels', () => {
      expect(getCategoryLabel('seo')).toContain('SEO');
      expect(getCategoryLabel('aeo')).toContain('AEO');
      expect(getCategoryLabel('geo')).toContain('GEO');
      expect(getCategoryLabel('llmo')).toContain('LLMO');
    });
  });

  describe('getScoreStatusEmoji', () => {
    it('should return green for high scores', () => {
      expect(getScoreStatusEmoji(100)).toBe('🟢');
      expect(getScoreStatusEmoji(85)).toBe('🟢');
      expect(getScoreStatusEmoji(80)).toBe('🟢');
    });

    it('should return yellow for medium scores', () => {
      expect(getScoreStatusEmoji(79)).toBe('🟡');
      expect(getScoreStatusEmoji(60)).toBe('🟡');
    });

    it('should return orange for low-medium scores', () => {
      expect(getScoreStatusEmoji(59)).toBe('🟠');
      expect(getScoreStatusEmoji(40)).toBe('🟠');
    });

    it('should return red for low scores', () => {
      expect(getScoreStatusEmoji(39)).toBe('🔴');
      expect(getScoreStatusEmoji(0)).toBe('🔴');
    });
  });

  describe('getPriorityEmoji', () => {
    it('should return correct emojis for priority levels', () => {
      expect(getPriorityEmoji('critical')).toBe('🔴');
      expect(getPriorityEmoji('high')).toBe('🟠');
      expect(getPriorityEmoji('medium')).toBe('🟡');
      expect(getPriorityEmoji('low')).toBe('🟢');
    });
  });
});
