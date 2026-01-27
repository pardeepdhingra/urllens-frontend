// ============================================================================
// URL Lens - Structured Data Analyzer
// Parses JSON-LD, Microdata, and RDFa for SEO analysis
// ============================================================================

import * as cheerio from 'cheerio';
import type { StructuredDataAnalysis } from '@/types/seo';

/**
 * Analyze structured data in HTML content
 */
export function analyzeStructuredData(html: string): StructuredDataAnalysis {
  const $ = cheerio.load(html);

  // Initialize result
  const result: StructuredDataAnalysis = {
    hasJsonLd: false,
    jsonLdCount: 0,
    jsonLdTypes: [],
    schemas: {
      organization: false,
      website: false,
      webpage: false,
      article: false,
      newsArticle: false,
      blogPosting: false,
      faqPage: false,
      howTo: false,
      qaPage: false,
      breadcrumbList: false,
      product: false,
      localBusiness: false,
      person: false,
      speakable: false,
      claimReview: false,
      review: false,
      event: false,
      recipe: false,
      videoObject: false,
    },
    hasMicrodata: false,
    hasRdfa: false,
    authorInfo: null,
    organizationInfo: null,
    datePublished: null,
    dateModified: null,
  };

  // Parse JSON-LD scripts
  const jsonLdScripts = $('script[type="application/ld+json"]');
  result.jsonLdCount = jsonLdScripts.length;
  result.hasJsonLd = jsonLdScripts.length > 0;

  const allJsonLdObjects: Record<string, unknown>[] = [];

  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);

        // Handle @graph arrays
        if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          allJsonLdObjects.push(...parsed['@graph']);
        } else if (Array.isArray(parsed)) {
          allJsonLdObjects.push(...parsed);
        } else {
          allJsonLdObjects.push(parsed);
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  });

  // Analyze each JSON-LD object
  for (const obj of allJsonLdObjects) {
    const type = getSchemaType(obj);
    if (type) {
      result.jsonLdTypes.push(type);
      mapSchemaType(type, result);

      // Extract additional data based on type
      extractAuthorInfo(obj, result);
      extractOrganizationInfo(obj, result);
      extractDates(obj, result);
    }
  }

  // Check for Microdata
  result.hasMicrodata = $('[itemscope]').length > 0;

  // Check for RDFa
  result.hasRdfa = $('[typeof]').length > 0 || $('[property]').length > 0;

  // Deduplicate types
  result.jsonLdTypes = [...new Set(result.jsonLdTypes)];

  return result;
}

/**
 * Get the @type from a JSON-LD object
 */
function getSchemaType(obj: Record<string, unknown>): string | null {
  const type = obj['@type'];
  if (typeof type === 'string') {
    return type;
  }
  if (Array.isArray(type) && type.length > 0) {
    return type[0] as string;
  }
  return null;
}

/**
 * Map schema type to result flags
 */
function mapSchemaType(type: string, result: StructuredDataAnalysis): void {
  const normalizedType = type.toLowerCase().replace('schema.org/', '').replace('https://', '').replace('http://', '');

  const typeMap: Record<string, keyof typeof result.schemas> = {
    'organization': 'organization',
    'website': 'website',
    'webpage': 'webpage',
    'webPage': 'webpage',
    'article': 'article',
    'newsarticle': 'newsArticle',
    'blogposting': 'blogPosting',
    'faqpage': 'faqPage',
    'howto': 'howTo',
    'qapage': 'qaPage',
    'breadcrumblist': 'breadcrumbList',
    'product': 'product',
    'localbusiness': 'localBusiness',
    'person': 'person',
    'speakablespecification': 'speakable',
    'claimreview': 'claimReview',
    'review': 'review',
    'event': 'event',
    'recipe': 'recipe',
    'videoobject': 'videoObject',
  };

  for (const [key, schemaKey] of Object.entries(typeMap)) {
    if (normalizedType.includes(key)) {
      result.schemas[schemaKey] = true;
      break;
    }
  }

  // Check for speakable property within other types
  // (speakable can be a property, not just a type)
}

/**
 * Extract author information from JSON-LD
 */
function extractAuthorInfo(obj: Record<string, unknown>, result: StructuredDataAnalysis): void {
  const author = obj.author as Record<string, unknown> | undefined;
  if (author && !result.authorInfo) {
    result.authorInfo = {
      name: (author.name as string) || null,
      url: (author.url as string) || null,
      image: extractImageUrl(author.image),
      jobTitle: (author.jobTitle as string) || null,
      sameAs: extractSameAs(author.sameAs),
    };
  }

  // Also check for Person type
  if (getSchemaType(obj) === 'Person' && !result.authorInfo) {
    result.authorInfo = {
      name: (obj.name as string) || null,
      url: (obj.url as string) || null,
      image: extractImageUrl(obj.image),
      jobTitle: (obj.jobTitle as string) || null,
      sameAs: extractSameAs(obj.sameAs),
    };
  }
}

/**
 * Extract organization information from JSON-LD
 */
function extractOrganizationInfo(obj: Record<string, unknown>, result: StructuredDataAnalysis): void {
  const type = getSchemaType(obj);

  if ((type === 'Organization' || type === 'LocalBusiness') && !result.organizationInfo) {
    result.organizationInfo = {
      name: (obj.name as string) || null,
      url: (obj.url as string) || null,
      logo: extractImageUrl(obj.logo),
      sameAs: extractSameAs(obj.sameAs),
    };
  }

  // Check publisher property
  const publisher = obj.publisher as Record<string, unknown> | undefined;
  if (publisher && !result.organizationInfo) {
    result.organizationInfo = {
      name: (publisher.name as string) || null,
      url: (publisher.url as string) || null,
      logo: extractImageUrl(publisher.logo),
      sameAs: extractSameAs(publisher.sameAs),
    };
  }
}

/**
 * Extract dates from JSON-LD
 */
function extractDates(obj: Record<string, unknown>, result: StructuredDataAnalysis): void {
  if (obj.datePublished && !result.datePublished) {
    result.datePublished = obj.datePublished as string;
  }
  if (obj.dateModified && !result.dateModified) {
    result.dateModified = obj.dateModified as string;
  }
}

/**
 * Extract image URL from various formats
 */
function extractImageUrl(image: unknown): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image !== null) {
    const imgObj = image as Record<string, unknown>;
    return (imgObj.url as string) || (imgObj['@id'] as string) || null;
  }
  return null;
}

/**
 * Extract sameAs URLs
 */
function extractSameAs(sameAs: unknown): string[] {
  if (!sameAs) return [];
  if (typeof sameAs === 'string') return [sameAs];
  if (Array.isArray(sameAs)) return sameAs.filter(s => typeof s === 'string');
  return [];
}
