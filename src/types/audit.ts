// ============================================================================
// URL Lens - Audit Types
// Type definitions for URL Audit & Investigation feature
// ============================================================================

// ============================================================================
// Request Types
// ============================================================================

export type AuditMode = 'batch' | 'domain';

export interface AuditRequest {
  mode: AuditMode;
  urls?: string[];      // For batch mode - array of URLs
  domain?: string;      // For domain mode - root domain to audit
}

export interface AuditOptions {
  maxDomainsPerAudit?: number;    // Default: 5
  maxUrlsPerDomain?: number;      // Default: 100
  timeoutMs?: number;             // Default: 10000 (10s)
  concurrency?: number;           // Default: 5
}

// ============================================================================
// Result Types
// ============================================================================

export interface URLAuditResult {
  url: string;
  finalUrl: string;
  status: number;
  accessible: boolean;
  redirects: AuditRedirect[];
  blockedReason?: string;
  contentType?: string;
  jsRequired: boolean;
  botProtections: string[];
  responseTimeMs?: number;
  scrapeLikelihoodScore: number;
  scoreBreakdown: ScoreBreakdown;
  recommendation: AuditRecommendation;
}

export interface AuditRedirect {
  from: string;
  to: string;
  status: number;
}

export interface ScoreBreakdown {
  httpStatus: number;       // +40 for 200
  jsRequired: number;       // +20 if no JS required
  htmlResponse: number;     // +15 for HTML content type
  botProtection: number;    // +15 if no bot protection
  redirectChain: number;    // +10 for short chain (≤2)
  total: number;
}

export type AuditRecommendation =
  | 'best_entry_point'
  | 'good'
  | 'moderate'
  | 'challenging'
  | 'blocked';

// ============================================================================
// Session Types
// ============================================================================

export type AuditStatus = 'pending' | 'discovering' | 'testing' | 'scoring' | 'completed' | 'failed';

export interface AuditSession {
  id: string;
  userId: string;
  mode: AuditMode;
  domain?: string;
  totalUrls: number;
  completedUrls: number;
  status: AuditStatus;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AuditProgress {
  status: AuditStatus;
  currentStep: string;
  totalUrls: number;
  completedUrls: number;
  discoveredUrls?: number;
  percentComplete: number;
  error?: string;
  // Latest batch results for progressive UI updates
  latestResults?: URLAuditResult[];
}

// ============================================================================
// Discovery Types
// ============================================================================

export interface DomainDiscoveryResult {
  domain: string;
  rootAccessible: boolean;
  rootStatus?: number;
  rootBlockedReason?: string;
  discoveredUrls: DiscoveredURL[];
  sources: DiscoverySource[];
}

export interface DiscoveredURL {
  url: string;
  source: DiscoverySourceType;
}

export type DiscoverySourceType =
  | 'sitemap'
  | 'sitemap_index'
  | 'robots_txt'
  | 'common_path';

export interface DiscoverySource {
  type: DiscoverySourceType;
  url: string;
  urlsFound: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AuditResponse {
  success: boolean;
  sessionId?: string;
  results?: URLAuditResult[];
  discovery?: DomainDiscoveryResult;
  summary?: AuditSummary;
  error?: string;
}

export interface AuditSummary {
  totalUrls: number;
  accessibleCount: number;
  blockedCount: number;
  averageScore: number;
  jsRequiredCount?: number;
  bestEntryPoints: URLAuditResult[];
  byStatus?: Record<number, number>;
  recommendationBreakdown?: {
    best_entry_point: number;
    good: number;
    moderate: number;
    challenging: number;
    blocked: number;
  };
  commonProtections?: Array<{ name: string; count: number }>;
}

// ============================================================================
// CSV Parser Types
// ============================================================================

export interface CSVParseResult {
  urls: string[];
  invalidLines: string[];
  duplicatesRemoved: number;
}

// ============================================================================
// Database Types (matching Supabase schema)
// ============================================================================

export interface DBAuditSession {
  id: string;
  user_id: string;
  mode: string;
  domain: string | null;
  total_urls: number;
  completed_urls: number;
  status: string;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DBAuditResult {
  id: string;
  session_id: string;
  user_id: string;
  url: string;
  status_code: number | null;
  final_url: string | null;
  scrape_score: number | null;
  requires_js: boolean;
  bot_protections: string[];
  redirects: AuditRedirect[];
  accessible: boolean | null;
  recommendation: string | null;
  blocked_reason: string | null;
  content_type: string | null;
  response_time_ms: number | null;
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

export const AUDIT_LIMITS = {
  maxDomainsPerAudit: 5,
  maxUrlsPerDomain: 100,
  timeoutMs: 10000,
  concurrency: 5,
} as const;

export const COMMON_PATHS = [
  '/about',
  '/about-us',
  '/contact',
  '/contact-us',
  '/blog',
  '/news',
  '/products',
  '/services',
  '/pricing',
  '/faq',
  '/help',
  '/support',
  '/terms',
  '/privacy',
  '/careers',
  '/team',
] as const;

export const SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemaps.xml',
] as const;
