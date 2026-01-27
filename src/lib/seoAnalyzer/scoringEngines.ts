// ============================================================================
// URL Lens - SEO/AEO/GEO/LLMO Scoring Engines
// Calculates individual scores with detailed breakdown and recommendations
// ============================================================================

import type {
  HTMLAnalysisData,
  StructuredDataAnalysis,
  ContentQualityAnalysis,
  SEOScore,
  AEOScore,
  GEOScore,
  LLMOScore,
  ScoreIssue,
  ScoreCategory,
} from '@/types/seo';
import { getGradeFromScore } from '@/types/seo';

// Re-export the helper function
export { getGradeFromScore } from '@/types/seo';

// ============================================================================
// SEO Scoring Engine
// ============================================================================

export function calculateSEOScore(
  html: HTMLAnalysisData,
  structured: StructuredDataAnalysis,
  responseTimeMs: number
): SEOScore {
  const issues: ScoreIssue[] = [];
  const passedChecks: string[] = [];

  // Technical category (40 points max)
  let technicalScore = 40;
  const technicalIssues: ScoreIssue[] = [];

  // HTTPS check
  if (!html.isHttps) {
    technicalScore -= 15;
    technicalIssues.push({
      id: 'seo-no-https',
      factor: 'HTTPS',
      description: 'Site is not using HTTPS',
      points: 15,
      maxPoints: 15,
      priority: 'critical',
      howToFix: 'Enable SSL certificate and redirect all HTTP traffic to HTTPS',
    });
  } else {
    passedChecks.push('HTTPS enabled');
  }

  // Canonical tag
  if (!html.canonical) {
    technicalScore -= 5;
    technicalIssues.push({
      id: 'seo-no-canonical',
      factor: 'Canonical Tag',
      description: 'Missing canonical tag',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add <link rel="canonical" href="https://yoursite.com/page"> to the <head>',
    });
  } else {
    passedChecks.push('Canonical tag present');
  }

  // Viewport meta tag
  if (!html.viewport) {
    technicalScore -= 10;
    technicalIssues.push({
      id: 'seo-no-viewport',
      factor: 'Viewport Meta',
      description: 'Missing viewport meta tag (not mobile-friendly)',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>',
    });
  } else {
    passedChecks.push('Viewport meta tag present');
  }

  // Language attribute
  if (!html.language) {
    technicalScore -= 3;
    technicalIssues.push({
      id: 'seo-no-lang',
      factor: 'Language Attribute',
      description: 'Missing language attribute on HTML tag',
      points: 3,
      maxPoints: 3,
      priority: 'low',
      howToFix: 'Add lang="en" (or appropriate language) to the <html> tag',
    });
  } else {
    passedChecks.push('Language attribute set');
  }

  // Response time
  if (responseTimeMs > 3000) {
    technicalScore -= 7;
    technicalIssues.push({
      id: 'seo-slow-response',
      factor: 'Response Time',
      description: `Slow server response time (${responseTimeMs}ms > 3000ms)`,
      points: 7,
      maxPoints: 7,
      priority: 'high',
      howToFix: 'Optimize server performance, enable caching, use a CDN',
    });
  } else {
    passedChecks.push('Good response time');
  }

  // Content category (35 points max)
  let contentScore = 35;
  const contentIssues: ScoreIssue[] = [];

  // Title tag
  if (!html.title || html.titleLength === 0) {
    contentScore -= 10;
    contentIssues.push({
      id: 'seo-no-title',
      factor: 'Title Tag',
      description: 'Missing or empty title tag',
      points: 10,
      maxPoints: 10,
      priority: 'critical',
      howToFix: 'Add a descriptive <title> tag (50-60 characters recommended)',
    });
  } else if (html.titleLength > 60) {
    contentScore -= 3;
    contentIssues.push({
      id: 'seo-title-long',
      factor: 'Title Length',
      description: `Title too long (${html.titleLength} chars, recommended: 50-60)`,
      points: 3,
      maxPoints: 3,
      priority: 'low',
      howToFix: 'Shorten your title to 50-60 characters for optimal display in search results',
    });
  } else {
    passedChecks.push('Title tag optimized');
  }

  // Meta description
  if (!html.metaDescription) {
    contentScore -= 8;
    contentIssues.push({
      id: 'seo-no-description',
      factor: 'Meta Description',
      description: 'Missing meta description',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Add <meta name="description" content="..."> (150-160 characters recommended)',
    });
  } else if (html.metaDescriptionLength > 160) {
    contentScore -= 2;
    contentIssues.push({
      id: 'seo-description-long',
      factor: 'Description Length',
      description: `Meta description too long (${html.metaDescriptionLength} chars, recommended: 150-160)`,
      points: 2,
      maxPoints: 2,
      priority: 'low',
      howToFix: 'Shorten your meta description to 150-160 characters',
    });
  } else {
    passedChecks.push('Meta description optimized');
  }

  // H1 tag
  if (html.h1Tags.length === 0) {
    contentScore -= 7;
    contentIssues.push({
      id: 'seo-no-h1',
      factor: 'H1 Tag',
      description: 'Missing H1 heading tag',
      points: 7,
      maxPoints: 7,
      priority: 'high',
      howToFix: 'Add a single <h1> tag with your main page heading',
    });
  } else if (html.h1Tags.length > 1) {
    contentScore -= 3;
    contentIssues.push({
      id: 'seo-multiple-h1',
      factor: 'Multiple H1 Tags',
      description: `Multiple H1 tags found (${html.h1Tags.length})`,
      points: 3,
      maxPoints: 3,
      priority: 'medium',
      howToFix: 'Use only one H1 tag per page for the main heading',
    });
  } else {
    passedChecks.push('Single H1 tag present');
  }

  // Image alt attributes
  if (html.totalImages > 0 && html.imagesWithoutAlt > 0) {
    const missingAltPenalty = Math.min(5, Math.ceil(html.imagesWithoutAlt / 2));
    contentScore -= missingAltPenalty;
    contentIssues.push({
      id: 'seo-missing-alt',
      factor: 'Image Alt Text',
      description: `${html.imagesWithoutAlt} of ${html.totalImages} images missing alt attributes`,
      points: missingAltPenalty,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add descriptive alt attributes to all images for accessibility and SEO',
    });
  } else if (html.totalImages > 0) {
    passedChecks.push('All images have alt text');
  }

  // Structure category (25 points max)
  let structureScore = 25;
  const structureIssues: ScoreIssue[] = [];

  // Open Graph tags
  if (!html.ogTitle && !html.ogDescription && !html.ogImage) {
    structureScore -= 5;
    structureIssues.push({
      id: 'seo-no-og',
      factor: 'Open Graph Tags',
      description: 'Missing Open Graph meta tags for social sharing',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add og:title, og:description, og:image, and og:url meta tags',
    });
  } else {
    passedChecks.push('Open Graph tags present');
  }

  // Twitter Card tags
  if (!html.twitterCard) {
    structureScore -= 3;
    structureIssues.push({
      id: 'seo-no-twitter',
      factor: 'Twitter Card Tags',
      description: 'Missing Twitter Card meta tags',
      points: 3,
      maxPoints: 3,
      priority: 'low',
      howToFix: 'Add twitter:card, twitter:title, twitter:description, twitter:image meta tags',
    });
  } else {
    passedChecks.push('Twitter Card tags present');
  }

  // Structured data
  if (!structured.hasJsonLd && !structured.hasMicrodata) {
    structureScore -= 10;
    structureIssues.push({
      id: 'seo-no-schema',
      factor: 'Structured Data',
      description: 'No structured data (JSON-LD or Microdata) found',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Add JSON-LD structured data for your content type (Article, Organization, etc.)',
    });
  } else {
    passedChecks.push('Structured data present');
  }

  // Semantic HTML
  if (!html.hasMainTag && !html.hasArticleTag) {
    structureScore -= 4;
    structureIssues.push({
      id: 'seo-no-semantic',
      factor: 'Semantic HTML',
      description: 'Missing semantic HTML elements (main, article)',
      points: 4,
      maxPoints: 4,
      priority: 'low',
      howToFix: 'Use semantic HTML5 elements like <main>, <article>, <section>, <nav>',
    });
  } else {
    passedChecks.push('Semantic HTML used');
  }

  // Combine all issues
  issues.push(...technicalIssues, ...contentIssues, ...structureIssues);

  // Calculate final score
  const finalScore = Math.max(0, Math.min(100, technicalScore + contentScore + structureScore));

  return {
    score: finalScore,
    grade: getGradeFromScore(finalScore),
    categories: {
      technical: {
        name: 'Technical',
        score: Math.max(0, technicalScore),
        maxScore: 40,
        issues: technicalIssues,
      },
      content: {
        name: 'Content',
        score: Math.max(0, contentScore),
        maxScore: 35,
        issues: contentIssues,
      },
      structure: {
        name: 'Structure',
        score: Math.max(0, structureScore),
        maxScore: 25,
        issues: structureIssues,
      },
    },
    issues,
    passedChecks,
  };
}

// ============================================================================
// AEO Scoring Engine (Answer Engine Optimization)
// ============================================================================

export function calculateAEOScore(
  html: HTMLAnalysisData,
  structured: StructuredDataAnalysis,
  content: ContentQualityAnalysis
): AEOScore {
  const issues: ScoreIssue[] = [];
  const passedChecks: string[] = [];

  // Structured Data category (35 points max)
  let structuredDataScore = 35;
  const structuredDataIssues: ScoreIssue[] = [];

  // FAQ Schema
  if (!structured.schemas.faqPage) {
    structuredDataScore -= 12;
    structuredDataIssues.push({
      id: 'aeo-no-faq-schema',
      factor: 'FAQ Schema',
      description: 'Missing FAQPage structured data',
      points: 12,
      maxPoints: 12,
      priority: 'high',
      howToFix: 'Add FAQPage JSON-LD schema for Q&A content to appear in rich results',
      codeExample: '{"@type": "FAQPage", "mainEntity": [{"@type": "Question", ...}]}',
    });
  } else {
    passedChecks.push('FAQ schema present');
  }

  // HowTo Schema
  if (!structured.schemas.howTo && content.hasStepByStep) {
    structuredDataScore -= 8;
    structuredDataIssues.push({
      id: 'aeo-no-howto-schema',
      factor: 'HowTo Schema',
      description: 'Step-by-step content found but missing HowTo schema',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Add HowTo JSON-LD schema for step-by-step instructions',
    });
  } else if (structured.schemas.howTo) {
    passedChecks.push('HowTo schema present');
  }

  // Q&A Schema
  if (!structured.schemas.qaPage && content.questionHeadingsCount > 2) {
    structuredDataScore -= 8;
    structuredDataIssues.push({
      id: 'aeo-no-qa-schema',
      factor: 'Q&A Schema',
      description: 'Question-based content found but missing QAPage schema',
      points: 8,
      maxPoints: 8,
      priority: 'medium',
      howToFix: 'Add QAPage JSON-LD schema for question-and-answer content',
    });
  } else if (structured.schemas.qaPage) {
    passedChecks.push('Q&A schema present');
  }

  // Breadcrumb Schema
  if (!structured.schemas.breadcrumbList) {
    structuredDataScore -= 4;
    structuredDataIssues.push({
      id: 'aeo-no-breadcrumb',
      factor: 'Breadcrumb Schema',
      description: 'Missing BreadcrumbList structured data',
      points: 4,
      maxPoints: 4,
      priority: 'low',
      howToFix: 'Add BreadcrumbList JSON-LD to help search engines understand site structure',
    });
  } else {
    passedChecks.push('Breadcrumb schema present');
  }

  // Content Structure category (35 points max)
  let contentStructureScore = 35;
  const contentStructureIssues: ScoreIssue[] = [];

  // Question-based headings
  if (content.questionHeadingsCount === 0) {
    contentStructureScore -= 10;
    contentStructureIssues.push({
      id: 'aeo-no-question-headings',
      factor: 'Question Headings',
      description: 'No question-based headings found',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Use headings that match how users search, like "What is X?" or "How to Y?"',
    });
  } else {
    passedChecks.push(`${content.questionHeadingsCount} question-based headings`);
  }

  // Lists for scannable content
  if (!html.hasOrderedLists && !html.hasUnorderedLists) {
    contentStructureScore -= 5;
    contentStructureIssues.push({
      id: 'aeo-no-lists',
      factor: 'List Content',
      description: 'No bulleted or numbered lists found',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Use lists to present information in a scannable, snippet-friendly format',
    });
  } else {
    passedChecks.push('Lists used for scannable content');
  }

  // Paragraph length (concise answers)
  if (content.avgWordsPerParagraph > 100) {
    contentStructureScore -= 8;
    contentStructureIssues.push({
      id: 'aeo-long-paragraphs',
      factor: 'Paragraph Length',
      description: `Paragraphs too long for snippets (avg: ${content.avgWordsPerParagraph} words)`,
      points: 8,
      maxPoints: 8,
      priority: 'medium',
      howToFix: 'Break long paragraphs into shorter, more digestible chunks (40-60 words ideal)',
    });
  } else {
    passedChecks.push('Good paragraph length for snippets');
  }

  // Summary/TL;DR section
  if (!content.hasSummarySection) {
    contentStructureScore -= 5;
    contentStructureIssues.push({
      id: 'aeo-no-summary',
      factor: 'Summary Section',
      description: 'No summary or key takeaways section found',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add a "Key Takeaways" or "Summary" section at the beginning or end',
    });
  } else {
    passedChecks.push('Summary section present');
  }

  // Tables for data
  if (!html.hasTables && content.hasStatistics) {
    contentStructureScore -= 4;
    contentStructureIssues.push({
      id: 'aeo-no-tables',
      factor: 'Table Content',
      description: 'Statistics present but no tables for data presentation',
      points: 4,
      maxPoints: 4,
      priority: 'low',
      howToFix: 'Present comparative data in tables for table snippet eligibility',
    });
  } else if (html.hasTables) {
    passedChecks.push('Tables used for data');
  }

  // Snippet Optimization category (30 points max)
  let snippetScore = 30;
  const snippetIssues: ScoreIssue[] = [];

  // Question in title
  if (!content.hasQuestionInTitle && content.questionHeadingsCount > 0) {
    snippetScore -= 5;
    snippetIssues.push({
      id: 'aeo-no-question-title',
      factor: 'Question Title',
      description: 'Content has Q&A format but title is not question-optimized',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Consider using a question format in your title to match search queries',
    });
  } else if (content.hasQuestionInTitle) {
    passedChecks.push('Question-optimized title');
  }

  // Featured snippet format check
  const hasSnippetFormat = html.hasOrderedLists || html.hasUnorderedLists || html.hasTables ||
    content.hasDefinitions || content.hasStepByStep;
  if (!hasSnippetFormat) {
    snippetScore -= 10;
    snippetIssues.push({
      id: 'aeo-no-snippet-format',
      factor: 'Snippet Format',
      description: 'Content not formatted for featured snippets',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Structure content as lists, tables, or definitions for snippet eligibility',
    });
  } else {
    passedChecks.push('Content formatted for snippets');
  }

  // First paragraph length (position zero optimization)
  if (content.paragraphCount > 0 && content.avgWordsPerParagraph > 50) {
    snippetScore -= 5;
    snippetIssues.push({
      id: 'aeo-long-intro',
      factor: 'Intro Paragraph',
      description: 'Opening paragraphs may be too long for snippet extraction',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Keep the first paragraph concise (40-50 words) with a direct answer',
    });
  } else {
    passedChecks.push('Concise intro paragraph');
  }

  // FAQ section
  if (!content.hasFAQSection && !structured.schemas.faqPage) {
    snippetScore -= 7;
    snippetIssues.push({
      id: 'aeo-no-faq-section',
      factor: 'FAQ Section',
      description: 'No FAQ section or FAQ schema found',
      points: 7,
      maxPoints: 7,
      priority: 'high',
      howToFix: 'Add an FAQ section with common questions and concise answers',
    });
  } else {
    passedChecks.push('FAQ content present');
  }

  // Combine all issues
  issues.push(...structuredDataIssues, ...contentStructureIssues, ...snippetIssues);

  // Calculate final score
  const finalScore = Math.max(0, Math.min(100, structuredDataScore + contentStructureScore + snippetScore));

  return {
    score: finalScore,
    grade: getGradeFromScore(finalScore),
    categories: {
      structuredData: {
        name: 'Structured Data',
        score: Math.max(0, structuredDataScore),
        maxScore: 35,
        issues: structuredDataIssues,
      },
      contentStructure: {
        name: 'Content Structure',
        score: Math.max(0, contentStructureScore),
        maxScore: 35,
        issues: contentStructureIssues,
      },
      snippetOptimization: {
        name: 'Snippet Optimization',
        score: Math.max(0, snippetScore),
        maxScore: 30,
        issues: snippetIssues,
      },
    },
    issues,
    passedChecks,
  };
}

// ============================================================================
// GEO Scoring Engine (Generative Engine Optimization)
// ============================================================================

export function calculateGEOScore(
  html: HTMLAnalysisData,
  structured: StructuredDataAnalysis,
  content: ContentQualityAnalysis
): GEOScore {
  const issues: ScoreIssue[] = [];
  const passedChecks: string[] = [];

  // AI Readability category (30 points max)
  let aiReadabilityScore = 30;
  const aiReadabilityIssues: ScoreIssue[] = [];

  // Clear content hierarchy
  const hasGoodHierarchy = html.h1Tags.length === 1 && html.h2Tags.length > 0;
  if (!hasGoodHierarchy) {
    aiReadabilityScore -= 10;
    aiReadabilityIssues.push({
      id: 'geo-poor-hierarchy',
      factor: 'Content Hierarchy',
      description: 'Content lacks clear heading hierarchy',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Use a single H1 followed by logical H2/H3 structure for clear topic organization',
    });
  } else {
    passedChecks.push('Clear content hierarchy');
  }

  // Semantic HTML
  if (!html.hasArticleTag && !html.hasMainTag && !html.hasSectionTags) {
    aiReadabilityScore -= 8;
    aiReadabilityIssues.push({
      id: 'geo-no-semantic',
      factor: 'Semantic HTML',
      description: 'Missing semantic HTML elements for AI parsing',
      points: 8,
      maxPoints: 8,
      priority: 'medium',
      howToFix: 'Use <article>, <main>, <section> to help AI understand content structure',
    });
  } else {
    passedChecks.push('Semantic HTML used');
  }

  // Definitions present
  if (!content.hasDefinitions && content.wordCount > 500) {
    aiReadabilityScore -= 7;
    aiReadabilityIssues.push({
      id: 'geo-no-definitions',
      factor: 'Definitions',
      description: 'No clear definitions found for key terms',
      points: 7,
      maxPoints: 7,
      priority: 'medium',
      howToFix: 'Include clear definitions for main concepts (e.g., "X is defined as..." or "X refers to...")',
    });
  } else {
    passedChecks.push('Clear definitions present');
  }

  // Scannable content
  const isScannable = html.hasOrderedLists || html.hasUnorderedLists || html.hasTables;
  if (!isScannable) {
    aiReadabilityScore -= 5;
    aiReadabilityIssues.push({
      id: 'geo-not-scannable',
      factor: 'Content Scannability',
      description: 'Content not easily scannable (no lists or tables)',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Break up text with bullet points, numbered lists, or tables',
    });
  } else {
    passedChecks.push('Content is scannable');
  }

  // Citation Worthiness category (35 points max)
  let citationScore = 35;
  const citationIssues: ScoreIssue[] = [];

  // Author information
  if (!structured.authorInfo && !content.hasAuthorBio) {
    citationScore -= 10;
    citationIssues.push({
      id: 'geo-no-author',
      factor: 'Author Information',
      description: 'No author information or byline found',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Add author name, bio, and credentials to establish expertise',
    });
  } else {
    passedChecks.push('Author information present');
  }

  // Publication date
  if (!structured.datePublished) {
    citationScore -= 5;
    citationIssues.push({
      id: 'geo-no-date',
      factor: 'Publication Date',
      description: 'No publication date found in structured data',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add datePublished to your Article or WebPage schema',
    });
  } else {
    passedChecks.push('Publication date present');
  }

  // Sources/references
  if (!content.hasCitations && content.wordCount > 500) {
    citationScore -= 8;
    citationIssues.push({
      id: 'geo-no-sources',
      factor: 'Sources & References',
      description: 'No citations or references to external sources',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Cite credible sources, studies, or data to support your claims',
    });
  } else {
    passedChecks.push('Citations and references present');
  }

  // Expert credentials
  const hasCredentials = structured.authorInfo?.jobTitle || content.hasAuthorBio;
  if (!hasCredentials && content.wordCount > 300) {
    citationScore -= 7;
    citationIssues.push({
      id: 'geo-no-credentials',
      factor: 'Expert Credentials',
      description: 'No author credentials or expertise indicators',
      points: 7,
      maxPoints: 7,
      priority: 'medium',
      howToFix: 'Include author job title, qualifications, or relevant experience',
    });
  } else {
    passedChecks.push('Expert credentials visible');
  }

  // Organization info
  if (!structured.organizationInfo) {
    citationScore -= 5;
    citationIssues.push({
      id: 'geo-no-organization',
      factor: 'Organization Info',
      description: 'No organization structured data found',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Add Organization schema with name, logo, and sameAs links',
    });
  } else {
    passedChecks.push('Organization info present');
  }

  // Technical AI Signals category (35 points max)
  let technicalScore = 35;
  const technicalIssues: ScoreIssue[] = [];

  // JSON-LD structured data
  if (!structured.hasJsonLd) {
    technicalScore -= 12;
    technicalIssues.push({
      id: 'geo-no-jsonld',
      factor: 'JSON-LD',
      description: 'No JSON-LD structured data found',
      points: 12,
      maxPoints: 12,
      priority: 'critical',
      howToFix: 'Add JSON-LD schema for Article, Organization, and Author',
    });
  } else {
    passedChecks.push('JSON-LD structured data present');
  }

  // Entity markup
  const hasEntityMarkup = structured.schemas.person || structured.schemas.organization ||
    structured.organizationInfo || structured.authorInfo;
  if (!hasEntityMarkup) {
    technicalScore -= 8;
    technicalIssues.push({
      id: 'geo-no-entity',
      factor: 'Entity Markup',
      description: 'No entity markup (Person, Organization) found',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Add Person and Organization schemas with sameAs links to knowledge bases',
    });
  } else {
    passedChecks.push('Entity markup present');
  }

  // Content freshness (dateModified)
  if (!structured.dateModified) {
    technicalScore -= 5;
    technicalIssues.push({
      id: 'geo-no-modified-date',
      factor: 'Content Freshness',
      description: 'No dateModified found in structured data',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add dateModified to show when content was last updated',
    });
  } else {
    passedChecks.push('Last modified date present');
  }

  // Speakable content
  if (!structured.schemas.speakable && content.wordCount > 500) {
    technicalScore -= 5;
    technicalIssues.push({
      id: 'geo-no-speakable',
      factor: 'Speakable Content',
      description: 'No speakable schema for voice assistants',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Add Speakable schema to mark content suitable for text-to-speech',
    });
  } else if (structured.schemas.speakable) {
    passedChecks.push('Speakable content marked');
  }

  // Fact-check signals
  if (!structured.schemas.claimReview && content.hasStatistics) {
    technicalScore -= 5;
    technicalIssues.push({
      id: 'geo-no-factcheck',
      factor: 'Fact-Check Signals',
      description: 'Statistics present but no ClaimReview schema',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Consider adding ClaimReview schema for factual claims',
    });
  } else if (structured.schemas.claimReview) {
    passedChecks.push('Fact-check schema present');
  }

  // Combine all issues
  issues.push(...aiReadabilityIssues, ...citationIssues, ...technicalIssues);

  // Calculate final score
  const finalScore = Math.max(0, Math.min(100, aiReadabilityScore + citationScore + technicalScore));

  return {
    score: finalScore,
    grade: getGradeFromScore(finalScore),
    categories: {
      aiReadability: {
        name: 'AI Readability',
        score: Math.max(0, aiReadabilityScore),
        maxScore: 30,
        issues: aiReadabilityIssues,
      },
      citationWorthiness: {
        name: 'Citation Worthiness',
        score: Math.max(0, citationScore),
        maxScore: 35,
        issues: citationIssues,
      },
      technicalSignals: {
        name: 'Technical AI Signals',
        score: Math.max(0, technicalScore),
        maxScore: 35,
        issues: technicalIssues,
      },
    },
    issues,
    passedChecks,
  };
}

// ============================================================================
// LLMO Scoring Engine (Large Language Model Optimization)
// ============================================================================

export function calculateLLMOScore(
  html: HTMLAnalysisData,
  structured: StructuredDataAnalysis,
  content: ContentQualityAnalysis
): LLMOScore {
  const issues: ScoreIssue[] = [];
  const passedChecks: string[] = [];

  // E-E-A-T Signals category (35 points max)
  let eeatScore = 35;
  const eeatIssues: ScoreIssue[] = [];

  // Author bio/credentials
  if (!content.hasAuthorBio && !structured.authorInfo) {
    eeatScore -= 10;
    eeatIssues.push({
      id: 'llmo-no-author-bio',
      factor: 'Author Bio',
      description: 'No author bio or credentials found',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Add a detailed author bio with name, photo, title, and relevant expertise',
    });
  } else {
    passedChecks.push('Author bio present');
  }

  // Trust signals
  const trustSignalCount = [
    content.hasContactInfo,
    content.hasPrivacyPolicyLink,
    content.hasTermsOfServiceLink,
    content.hasAboutPageLink,
  ].filter(Boolean).length;

  if (trustSignalCount < 2) {
    eeatScore -= 8;
    eeatIssues.push({
      id: 'llmo-low-trust',
      factor: 'Trust Signals',
      description: 'Insufficient trust signals (contact, privacy, terms)',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Add contact information, privacy policy, and terms of service links',
    });
  } else {
    passedChecks.push('Trust signals present');
  }

  // Expertise indicators
  const hasExpertise = structured.authorInfo?.jobTitle ||
    (structured.authorInfo?.sameAs && structured.authorInfo.sameAs.length > 0) ||
    content.hasAuthorBio;
  if (!hasExpertise) {
    eeatScore -= 7;
    eeatIssues.push({
      id: 'llmo-no-expertise',
      factor: 'Expertise Indicators',
      description: 'No expertise indicators found',
      points: 7,
      maxPoints: 7,
      priority: 'medium',
      howToFix: 'Link author to LinkedIn, Wikipedia, or professional profiles',
    });
  } else {
    passedChecks.push('Expertise indicators present');
  }

  // Contact information
  if (!content.hasContactInfo) {
    eeatScore -= 5;
    eeatIssues.push({
      id: 'llmo-no-contact',
      factor: 'Contact Info',
      description: 'No contact information visible',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Add email, phone, or physical address for credibility',
    });
  } else {
    passedChecks.push('Contact information visible');
  }

  // Legal pages
  if (!content.hasPrivacyPolicyLink && !content.hasTermsOfServiceLink) {
    eeatScore -= 5;
    eeatIssues.push({
      id: 'llmo-no-legal',
      factor: 'Legal Pages',
      description: 'Missing links to privacy policy or terms of service',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Add footer links to privacy policy and terms of service',
    });
  } else {
    passedChecks.push('Legal pages linked');
  }

  // Content Quality category (35 points max)
  let contentQualityScore = 35;
  const contentQualityIssues: ScoreIssue[] = [];

  // Unique insights/statistics
  if (!content.hasStatistics && content.wordCount > 300) {
    contentQualityScore -= 10;
    contentQualityIssues.push({
      id: 'llmo-no-statistics',
      factor: 'Statistics & Data',
      description: 'No statistics, data, or unique insights found',
      points: 10,
      maxPoints: 10,
      priority: 'high',
      howToFix: 'Include original data, statistics, or research findings that LLMs can cite',
    });
  } else {
    passedChecks.push('Statistics and data present');
  }

  // Quotes/citations
  if (!content.hasBlockquotes && !content.hasCitations && content.wordCount > 500) {
    contentQualityScore -= 8;
    contentQualityIssues.push({
      id: 'llmo-no-quotes',
      factor: 'Quotes & Citations',
      description: 'No expert quotes or citations found',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Include quotes from experts, link to authoritative sources',
    });
  } else {
    passedChecks.push('Quotes and citations present');
  }

  // Original research indicators
  const hasOriginalResearch = content.hasStatistics && content.statisticsCount >= 3;
  if (!hasOriginalResearch && content.wordCount > 800) {
    contentQualityScore -= 7;
    contentQualityIssues.push({
      id: 'llmo-no-research',
      factor: 'Original Research',
      description: 'Limited original research or data',
      points: 7,
      maxPoints: 7,
      priority: 'medium',
      howToFix: 'Add original research, case studies, or proprietary data',
    });
  } else {
    passedChecks.push('Original research indicators');
  }

  // Content depth (word count)
  if (content.wordCount < 300) {
    contentQualityScore -= 5;
    contentQualityIssues.push({
      id: 'llmo-thin-content',
      factor: 'Content Depth',
      description: `Content appears thin (${content.wordCount} words)`,
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Expand content with more comprehensive coverage (aim for 800+ words for in-depth topics)',
    });
  } else {
    passedChecks.push('Adequate content depth');
  }

  // Expert quotes
  if (!content.hasBlockquotes && content.wordCount > 500) {
    contentQualityScore -= 5;
    contentQualityIssues.push({
      id: 'llmo-no-expert-quotes',
      factor: 'Expert Quotes',
      description: 'No blockquotes or expert commentary',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Include quotes from industry experts or thought leaders',
    });
  } else if (content.hasBlockquotes) {
    passedChecks.push('Expert quotes included');
  }

  // LLM Accessibility category (30 points max)
  let llmAccessibilityScore = 30;
  const llmAccessibilityIssues: ScoreIssue[] = [];

  // Clear topic entity
  const hasClearTopic = html.h1Tags.length === 1 && html.title;
  if (!hasClearTopic) {
    llmAccessibilityScore -= 8;
    llmAccessibilityIssues.push({
      id: 'llmo-unclear-topic',
      factor: 'Topic Clarity',
      description: 'Topic entity not clearly defined',
      points: 8,
      maxPoints: 8,
      priority: 'high',
      howToFix: 'Ensure a clear H1 and title that define the main topic',
    });
  } else {
    passedChecks.push('Clear topic entity');
  }

  // Knowledge graph signals (sameAs links)
  const hasSameAs = (structured.authorInfo?.sameAs && structured.authorInfo.sameAs.length > 0) ||
    (structured.organizationInfo?.sameAs && structured.organizationInfo.sameAs.length > 0);
  if (!hasSameAs) {
    llmAccessibilityScore -= 7;
    llmAccessibilityIssues.push({
      id: 'llmo-no-sameas',
      factor: 'Knowledge Graph Links',
      description: 'No sameAs links to knowledge bases (Wikipedia, LinkedIn, etc.)',
      points: 7,
      maxPoints: 7,
      priority: 'medium',
      howToFix: 'Add sameAs links in Person/Organization schema to Wikipedia, LinkedIn, etc.',
    });
  } else {
    passedChecks.push('Knowledge graph links present');
  }

  // Wikipedia-style structure
  const hasGoodStructure = html.h2Tags.length >= 2 && content.hasSummarySection;
  if (!hasGoodStructure && content.wordCount > 500) {
    llmAccessibilityScore -= 5;
    llmAccessibilityIssues.push({
      id: 'llmo-poor-structure',
      factor: 'Content Structure',
      description: 'Content lacks Wikipedia-style organization',
      points: 5,
      maxPoints: 5,
      priority: 'medium',
      howToFix: 'Structure content with clear sections, intro summary, and logical flow',
    });
  } else {
    passedChecks.push('Good content structure');
  }

  // Quotable content
  const hasQuotableContent = content.hasDefinitions || content.hasStatistics ||
    (content.avgWordsPerSentence < 25 && content.avgWordsPerSentence > 10);
  if (!hasQuotableContent) {
    llmAccessibilityScore -= 5;
    llmAccessibilityIssues.push({
      id: 'llmo-not-quotable',
      factor: 'Quotable Content',
      description: 'Content may not be easily quotable by LLMs',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Include concise, factual statements that LLMs can extract and cite',
    });
  } else {
    passedChecks.push('Content is quotable');
  }

  // Social proof
  if (!content.hasTestimonials && !content.hasReviews && !content.hasSocialLinks) {
    llmAccessibilityScore -= 5;
    llmAccessibilityIssues.push({
      id: 'llmo-no-social-proof',
      factor: 'Social Proof',
      description: 'No social proof (testimonials, reviews, social links)',
      points: 5,
      maxPoints: 5,
      priority: 'low',
      howToFix: 'Add customer testimonials, reviews, or links to social media presence',
    });
  } else {
    passedChecks.push('Social proof present');
  }

  // Combine all issues
  issues.push(...eeatIssues, ...contentQualityIssues, ...llmAccessibilityIssues);

  // Calculate final score
  const finalScore = Math.max(0, Math.min(100, eeatScore + contentQualityScore + llmAccessibilityScore));

  return {
    score: finalScore,
    grade: getGradeFromScore(finalScore),
    categories: {
      eeatSignals: {
        name: 'E-E-A-T Signals',
        score: Math.max(0, eeatScore),
        maxScore: 35,
        issues: eeatIssues,
      },
      contentQuality: {
        name: 'Content Quality',
        score: Math.max(0, contentQualityScore),
        maxScore: 35,
        issues: contentQualityIssues,
      },
      llmAccessibility: {
        name: 'LLM Accessibility',
        score: Math.max(0, llmAccessibilityScore),
        maxScore: 30,
        issues: llmAccessibilityIssues,
      },
    },
    issues,
    passedChecks,
  };
}
