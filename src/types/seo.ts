// ============================================================================
// URL Lens - SEO/AEO/GEO/LLMO Analysis Type Definitions
// ============================================================================

// ============================================================================
// HTML Analysis Types
// ============================================================================

export interface HTMLAnalysisData {
  // Meta tags
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonical: string | null;
  viewport: string | null;
  robots: string | null;
  language: string | null;

  // Open Graph
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  ogUrl: string | null;

  // Twitter Cards
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;

  // Content structure
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  h4Tags: string[];
  paragraphCount: number;
  avgParagraphLength: number;
  wordCount: number;

  // Images
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;

  // Links
  internalLinks: number;
  externalLinks: number;

  // Lists & Tables
  hasOrderedLists: boolean;
  hasUnorderedLists: boolean;
  hasDefinitionLists: boolean;
  hasTables: boolean;
  tableCount: number;

  // Semantic HTML
  hasArticleTag: boolean;
  hasSectionTags: boolean;
  hasMainTag: boolean;
  hasNavTag: boolean;
  hasHeaderTag: boolean;
  hasFooterTag: boolean;
  hasAsideTag: boolean;

  // Security
  isHttps: boolean;
}

// ============================================================================
// Structured Data Analysis Types
// ============================================================================

export interface StructuredDataAnalysis {
  hasJsonLd: boolean;
  jsonLdCount: number;
  jsonLdTypes: string[];

  schemas: {
    organization: boolean;
    website: boolean;
    webpage: boolean;
    article: boolean;
    newsArticle: boolean;
    blogPosting: boolean;
    faqPage: boolean;
    howTo: boolean;
    qaPage: boolean;
    breadcrumbList: boolean;
    product: boolean;
    localBusiness: boolean;
    person: boolean;
    speakable: boolean;
    claimReview: boolean;
    review: boolean;
    event: boolean;
    recipe: boolean;
    videoObject: boolean;
  };

  hasMicrodata: boolean;
  hasRdfa: boolean;

  // Extracted author info
  authorInfo: {
    name: string | null;
    url: string | null;
    image: string | null;
    jobTitle: string | null;
    sameAs: string[];
  } | null;

  // Extracted organization info
  organizationInfo: {
    name: string | null;
    url: string | null;
    logo: string | null;
    sameAs: string[];
  } | null;

  // Dates
  datePublished: string | null;
  dateModified: string | null;
}

// ============================================================================
// Content Quality Analysis Types
// ============================================================================

export interface ContentQualityAnalysis {
  // Readability metrics
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  paragraphCount: number;
  avgWordsPerParagraph: number;

  // Question optimization (for AEO)
  questionHeadings: string[];
  questionHeadingsCount: number;
  hasQuestionInTitle: boolean;

  // Content patterns
  hasDefinitions: boolean;
  hasStepByStep: boolean;
  hasSummarySection: boolean;
  hasFAQSection: boolean;
  hasTableOfContents: boolean;

  // Citations & credibility (for LLMO)
  hasStatistics: boolean;
  statisticsCount: number;
  hasBlockquotes: boolean;
  blockquoteCount: number;
  hasCitations: boolean;
  citationPatterns: number;

  // Trust signals
  hasAuthorBio: boolean;
  hasAuthorImage: boolean;
  hasContactInfo: boolean;
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasPhysicalAddress: boolean;
  hasPrivacyPolicyLink: boolean;
  hasTermsOfServiceLink: boolean;
  hasAboutPageLink: boolean;

  // Social proof
  hasTestimonials: boolean;
  hasReviews: boolean;
  hasSocialLinks: boolean;
}

// ============================================================================
// Score Types
// ============================================================================

export interface ScoreIssue {
  id: string;
  factor: string;
  description: string;
  points: number;
  maxPoints: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  howToFix: string;
  codeExample?: string;
  learnMoreUrl?: string;
}

export interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  issues: ScoreIssue[];
}

export interface SEOScore {
  score: number;
  grade: string;
  categories: {
    technical: ScoreCategory;
    content: ScoreCategory;
    structure: ScoreCategory;
  };
  issues: ScoreIssue[];
  passedChecks: string[];
}

export interface AEOScore {
  score: number;
  grade: string;
  categories: {
    structuredData: ScoreCategory;
    contentStructure: ScoreCategory;
    snippetOptimization: ScoreCategory;
  };
  issues: ScoreIssue[];
  passedChecks: string[];
}

export interface GEOScore {
  score: number;
  grade: string;
  categories: {
    aiReadability: ScoreCategory;
    citationWorthiness: ScoreCategory;
    technicalSignals: ScoreCategory;
  };
  issues: ScoreIssue[];
  passedChecks: string[];
}

export interface LLMOScore {
  score: number;
  grade: string;
  categories: {
    eeatSignals: ScoreCategory;
    contentQuality: ScoreCategory;
    llmAccessibility: ScoreCategory;
  };
  issues: ScoreIssue[];
  passedChecks: string[];
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface SEORecommendation {
  id: string;
  category: 'seo' | 'aeo' | 'geo' | 'llmo';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  pointsGain: number;
  howToFix: string;
  codeExample?: string;
  learnMoreUrl?: string;
}

// ============================================================================
// Main SEO Analysis Result
// ============================================================================

export interface SEOAnalysisResult {
  // Individual scores (no combined score)
  seo: SEOScore;
  aeo: AEOScore;
  geo: GEOScore;
  llmo: LLMOScore;

  // Raw analysis data
  htmlAnalysis: HTMLAnalysisData;
  structuredData: StructuredDataAnalysis;
  contentQuality: ContentQualityAnalysis;

  // Sorted recommendations (lowest score categories first)
  recommendations: SEORecommendation[];

  // Metadata
  url: string;
  analyzedAt: string;
  analysisVersion: string;
  analysisDurationMs: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export type ScoreGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';

export type ScoreStatus = 'excellent' | 'good' | 'needs-improvement' | 'poor';

export function getGradeFromScore(score: number): ScoreGrade {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

export function getStatusFromScore(score: number): ScoreStatus {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs-improvement';
  return 'poor';
}

export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'error';
}
