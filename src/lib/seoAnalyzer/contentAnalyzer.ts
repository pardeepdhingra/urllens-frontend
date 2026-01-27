// ============================================================================
// URL Lens - Content Quality Analyzer
// Analyzes content quality, readability, and trust signals
// ============================================================================

import * as cheerio from 'cheerio';
import type { ContentQualityAnalysis } from '@/types/seo';

// Type alias for Cheerio instance (same as urlAnalyzer.ts)
type CheerioInstance = ReturnType<typeof cheerio.load>;

/**
 * Analyze content quality for SEO/LLMO optimization
 */
export function analyzeContentQuality(html: string): ContentQualityAnalysis {
  const $ = cheerio.load(html);

  // Get body text for analysis
  const bodyText = getMainContent($);
  const sentences = extractSentences(bodyText);
  const words = bodyText.split(/\s+/).filter(w => w.length > 0);

  // Basic metrics
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  // Paragraph analysis
  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(p => p.length > 20);
  const paragraphCount = paragraphs.length;
  const totalParagraphWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
  const avgWordsPerParagraph = paragraphCount > 0 ? Math.round(totalParagraphWords / paragraphCount) : 0;

  // Question optimization (for AEO)
  const headings = [
    ...$('h1').map((_, el) => $(el).text().trim()).get(),
    ...$('h2').map((_, el) => $(el).text().trim()).get(),
    ...$('h3').map((_, el) => $(el).text().trim()).get(),
  ];

  const questionHeadings = headings.filter(h =>
    h.includes('?') ||
    /^(what|why|how|when|where|who|which|can|do|does|is|are|should|would|will)\s/i.test(h)
  );

  const title = $('title').first().text().trim();
  const hasQuestionInTitle = title.includes('?') ||
    /^(what|why|how|when|where|who|which|can|do|does|is|are|should|would|will)\s/i.test(title);

  // Content patterns
  const hasDefinitions = detectDefinitions($, bodyText);
  const hasStepByStep = detectStepByStep($, bodyText);
  const hasSummarySection = detectSummary($);
  const hasFAQSection = detectFAQSection($);
  const hasTableOfContents = detectTableOfContents($);

  // Citations & credibility (for LLMO)
  const statisticsData = detectStatistics(bodyText);
  const hasBlockquotes = $('blockquote').length > 0;
  const blockquoteCount = $('blockquote').length;
  const citationData = detectCitations($, bodyText);

  // Trust signals
  const trustSignals = detectTrustSignals($, bodyText);

  // Social proof
  const socialProof = detectSocialProof($, bodyText);

  return {
    // Readability metrics
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    paragraphCount,
    avgWordsPerParagraph,

    // Question optimization
    questionHeadings,
    questionHeadingsCount: questionHeadings.length,
    hasQuestionInTitle,

    // Content patterns
    hasDefinitions,
    hasStepByStep,
    hasSummarySection,
    hasFAQSection,
    hasTableOfContents,

    // Citations & credibility
    hasStatistics: statisticsData.hasStatistics,
    statisticsCount: statisticsData.count,
    hasBlockquotes,
    blockquoteCount,
    hasCitations: citationData.hasCitations,
    citationPatterns: citationData.count,

    // Trust signals
    ...trustSignals,

    // Social proof
    ...socialProof,
  };
}

/**
 * Get main content text, excluding navigation, footer, etc.
 */
function getMainContent($: CheerioInstance): string {
  // Clone and remove non-content elements
  const $clone = $.root().clone();
  $clone.find('script, style, nav, footer, header, aside, .navigation, .sidebar, .menu, .footer, .header').remove();

  // Try to get main content area first
  let content = $clone.find('main, article, .content, .main-content, #content, #main').text();

  // Fall back to body if no main content area found
  if (!content || content.trim().length < 100) {
    content = $clone.find('body').text();
  }

  return content.replace(/\s+/g, ' ').trim();
}

/**
 * Extract sentences from text
 */
function extractSentences(text: string): string[] {
  // Simple sentence splitting
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.split(/\s+/).length >= 3);
}

/**
 * Detect definition patterns
 */
function detectDefinitions($: CheerioInstance, bodyText: string): boolean {
  // Check for definition lists
  if ($('dl').length > 0) return true;

  // Check for definition patterns in text
  const definitionPatterns = [
    /is defined as/i,
    /refers to/i,
    /means that/i,
    /is a type of/i,
    /can be described as/i,
    /is known as/i,
    /\b\w+\s+is\s+(?:a|an|the)\s+/i,
  ];

  return definitionPatterns.some(pattern => pattern.test(bodyText));
}

/**
 * Detect step-by-step content
 */
function detectStepByStep($: CheerioInstance, bodyText: string): boolean {
  // Check for numbered lists
  if ($('ol').length > 0) return true;

  // Check for step patterns
  const stepPatterns = [
    /step\s+\d+/i,
    /\d+\.\s+\w+/,
    /first,?\s+\w+.*second,?\s+\w+/i,
    /\bstep-by-step\b/i,
    /\bhow to\b/i,
  ];

  return stepPatterns.some(pattern => pattern.test(bodyText));
}

/**
 * Detect summary section
 */
function detectSummary($: CheerioInstance): boolean {
  const summaryIndicators = [
    'summary', 'tldr', 'tl;dr', 'key takeaways', 'key points',
    'in summary', 'in conclusion', 'overview', 'quick summary',
    'at a glance', 'highlights', 'bottom line',
  ];

  const text = $('body').text().toLowerCase();
  const headings = $('h1, h2, h3, h4').map((_, el) => $(el).text().toLowerCase()).get();

  return summaryIndicators.some(indicator =>
    text.includes(indicator) || headings.some(h => h.includes(indicator))
  );
}

/**
 * Detect FAQ section
 */
function detectFAQSection($: CheerioInstance): boolean {
  const faqIndicators = [
    'faq', 'frequently asked', 'common questions', 'q&a', 'questions and answers',
  ];

  const text = $('body').text().toLowerCase();
  const headings = $('h1, h2, h3, h4').map((_, el) => $(el).text().toLowerCase()).get();

  // Also check for FAQ schema
  const hasFaqSchema = $('script[type="application/ld+json"]').text().toLowerCase().includes('faqpage');

  return faqIndicators.some(indicator =>
    text.includes(indicator) || headings.some(h => h.includes(indicator))
  ) || hasFaqSchema;
}

/**
 * Detect table of contents
 */
function detectTableOfContents($: CheerioInstance): boolean {
  const tocIndicators = [
    'table of contents', 'toc', 'contents', 'in this article',
    'on this page', 'jump to', 'quick links',
  ];

  const text = $('body').text().toLowerCase();

  // Check for common TOC class names
  const hasTocElement = $('[class*="toc"], [id*="toc"], [class*="table-of-contents"], [id*="table-of-contents"]').length > 0;

  return hasTocElement || tocIndicators.some(indicator => text.includes(indicator));
}

/**
 * Detect statistics in content
 */
function detectStatistics(bodyText: string): { hasStatistics: boolean; count: number } {
  const statPatterns = [
    /\d+%/g,                           // Percentages
    /\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|trillion))?/gi,  // Money
    /\d+(?:,\d{3})+/g,                 // Large numbers with commas
    /\d+x\s/g,                         // Multipliers (2x, 10x)
    /\d+(?:\.\d+)?\s*(?:million|billion|trillion)/gi,  // Written numbers
    /according to\s+(?:a\s+)?(?:\d{4}\s+)?(?:study|report|survey|research)/gi,
    /\d+\s+out\s+of\s+\d+/gi,         // Fractions
  ];

  let totalCount = 0;
  for (const pattern of statPatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      totalCount += matches.length;
    }
  }

  return {
    hasStatistics: totalCount > 0,
    count: totalCount,
  };
}

/**
 * Detect citations and references
 */
function detectCitations($: CheerioInstance, bodyText: string): { hasCitations: boolean; count: number } {
  let count = 0;

  // Check for citation elements
  count += $('cite, blockquote[cite], .citation, .reference, .footnote').length;

  // Check for citation patterns in text
  const citationPatterns = [
    /according to/gi,
    /\[\d+\]/g,                        // [1], [2] style citations
    /\(\d{4}\)/g,                      // (2024) year citations
    /source:/gi,
    /cited in/gi,
    /referenced in/gi,
    /as reported by/gi,
    /research by/gi,
    /study by/gi,
    /data from/gi,
  ];

  for (const pattern of citationPatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }

  return {
    hasCitations: count > 0,
    count,
  };
}

/**
 * Detect trust signals
 */
function detectTrustSignals($: CheerioInstance, bodyText: string): {
  hasAuthorBio: boolean;
  hasAuthorImage: boolean;
  hasContactInfo: boolean;
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasPhysicalAddress: boolean;
  hasPrivacyPolicyLink: boolean;
  hasTermsOfServiceLink: boolean;
  hasAboutPageLink: boolean;
} {
  const text = $('body').text().toLowerCase();
  const html = $.html().toLowerCase();

  // Author detection
  const hasAuthorBio =
    $('[class*="author"], [class*="byline"], [rel="author"], .bio, .writer').length > 0 ||
    /written by|author:|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(bodyText);

  const hasAuthorImage =
    $('[class*="author"] img, [class*="avatar"], .author-image, .bio img').length > 0;

  // Contact information
  const hasPhoneNumber = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(bodyText);
  const hasEmailAddress = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText);
  const hasPhysicalAddress =
    /\d+\s+[A-Za-z]+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)/i.test(bodyText) ||
    $('[class*="address"], address').length > 0;

  const hasContactInfo = hasPhoneNumber || hasEmailAddress || hasPhysicalAddress ||
    $('[href*="contact"], a:contains("Contact")').length > 0;

  // Legal pages
  const hasPrivacyPolicyLink =
    $('a[href*="privacy"]').length > 0 ||
    html.includes('privacy policy') ||
    html.includes('privacy-policy');

  const hasTermsOfServiceLink =
    $('a[href*="terms"], a[href*="tos"]').length > 0 ||
    html.includes('terms of service') ||
    html.includes('terms-of-service') ||
    html.includes('terms and conditions');

  const hasAboutPageLink =
    $('a[href*="about"]').length > 0 ||
    html.includes('about us');

  return {
    hasAuthorBio,
    hasAuthorImage,
    hasContactInfo,
    hasPhoneNumber,
    hasEmailAddress,
    hasPhysicalAddress,
    hasPrivacyPolicyLink,
    hasTermsOfServiceLink,
    hasAboutPageLink,
  };
}

/**
 * Detect social proof elements
 */
function detectSocialProof($: CheerioInstance, bodyText: string): {
  hasTestimonials: boolean;
  hasReviews: boolean;
  hasSocialLinks: boolean;
} {
  const html = $.html().toLowerCase();

  const hasTestimonials =
    $('[class*="testimonial"], [class*="quote"], .customer-review').length > 0 ||
    /testimonial|customer said|client said|what.*say/i.test(bodyText);

  const hasReviews =
    $('[class*="review"], [class*="rating"], .stars').length > 0 ||
    html.includes('review') ||
    /\d+(\.\d+)?\s*(out of\s*)?5\s*stars?/i.test(bodyText);

  const hasSocialLinks =
    $('a[href*="twitter.com"], a[href*="x.com"], a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"]').length > 0;

  return {
    hasTestimonials,
    hasReviews,
    hasSocialLinks,
  };
}
