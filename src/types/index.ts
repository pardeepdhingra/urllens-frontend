// ============================================================================
// URL Lens - Type Definitions
// ============================================================================

// Database record type matching Supabase schema
export interface URLAnalysis {
  id: string;
  user_id: string;
  url: string;
  final_url: string;
  status_code: number | null;
  redirect_count: number;
  redirects: Redirect[];
  response_time_ms: number | null;
  content_type: string | null;
  js_required: boolean;
  bot_protections: BotProtection[];
  score: number;
  recommendation: string;
  analyzed_at: string;
  created_at: string;
  // New fields for enhanced features
  headers?: Record<string, string>;
  robots_txt?: RobotsTxtResult;
  rate_limit_info?: RateLimitDetection;
  share_id?: string;
  // Visual analysis fields
  visual_analysis?: VisualAnalysisResult;
  // UTM tracking analysis
  utm_analysis?: UTMAnalysisResult;
  // SEO/AEO/GEO/LLMO analysis
  seo_analysis?: import('./seo').SEOAnalysisResult;
}

// robots.txt parsing result
export interface RobotsTxtResult {
  exists: boolean;
  allowed: boolean;
  crawl_delay?: number;
  sitemaps: string[];
  rules: RobotRule[];
  raw_content?: string;
}

export interface RobotRule {
  user_agent: string;
  allow: string[];
  disallow: string[];
}

// Rate limit detection result
export interface RateLimitDetection {
  detected: boolean;
  requests_made: number;
  requests_succeeded: number;
  estimated_limit?: number;
  time_window_seconds?: number;
  headers_found: string[];
}

// Visual Analysis - Redirect Screenshot
export interface RedirectScreenshot {
  step: number;
  url: string;
  status?: number;
  screenshot_url?: string;
  screenshot_base64?: string;
  page_title?: string;
  timestamp: string;
  blocked_reason?: 'captcha' | 'cloudflare' | 'rate_limit' | 'access_denied' | 'timeout' | null;
}

// Visual Analysis Result
export interface VisualAnalysisResult {
  screenshots: RedirectScreenshot[];
  total_redirects: number;
  final_url: string;
  blocked: boolean;
  blocked_at_step?: number;
  analysis_duration_ms: number;
  // Fields for when visual analysis is disabled
  disabled?: boolean;
  disabled_reason?: string;
}

// UTM & Parameter Tracking
export interface ParameterChange {
  name: string;
  action: 'preserved' | 'added' | 'removed' | 'modified';
  originalValue?: string;
  newValue?: string;
}

export interface RedirectParameterState {
  step: number;
  url: string;
  allParams: Record<string, string>;
  utmParams: Record<string, string>;
  changes: ParameterChange[];
}

export interface UTMIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedParams: string[];
  step?: number;
}

export interface UTMAnalysisResult {
  hasUtmParams: boolean;
  utmPreserved: boolean;
  allParamsPreserved: boolean;
  initialUtmParams: Record<string, string>;
  finalUtmParams: Record<string, string>;
  utmLostAt?: number;
  initialParams: Record<string, string>;
  finalParams: Record<string, string>;
  parameterFlow: RedirectParameterState[];
  paramsAdded: string[];
  paramsRemoved: string[];
  paramsModified: string[];
  issues: UTMIssue[];
}

// Redirect chain item
export interface Redirect {
  from: string;
  to: string;
  status: number;
}

// Bot protection detection
export interface BotProtection {
  type: BotProtectionType;
  confidence: 'low' | 'medium' | 'high';
  details?: string;
}

export type BotProtectionType =
  | 'cloudflare'
  | 'recaptcha'
  | 'hcaptcha'
  | 'datadome'
  | 'akamai'
  | 'imperva'
  | 'perimeterx'
  | 'fingerprinting'
  | 'rate_limiting'
  | 'unknown';

// Analysis result from the analyzer
export interface AnalysisResult {
  url: string;
  final_url: string;
  status: number;
  redirects: Redirect[];
  js_hints: boolean;
  bot_protections: BotProtection[];
  score: number;
  recommendation: string;
  response_time_ms: number;
  content_type?: string;
  headers?: Record<string, string>;
  robotsTxt?: RobotsTxtResult;
  rateLimitInfo?: RateLimitDetection;
  visualAnalysis?: VisualAnalysisResult;
  utmAnalysis?: UTMAnalysisResult;
  seoAnalysis?: import('./seo').SEOAnalysisResult;
}

// API request/response types
export interface AnalyzeRequest {
  url: string;
  visualAnalysis?: boolean;
  seoAnalysis?: boolean;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: URLAnalysis;
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: URLAnalysis[];
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  confirmPassword?: string;
}

// Scoring breakdown
export interface ScoreBreakdown {
  base_score: number;
  status_penalty: number;
  redirect_penalty: number;
  js_penalty: number;
  bot_protection_penalty: number;
  final_score: number;
}

// Rate limiting
export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

// Component props types
export interface URLInputProps {
  onAnalyze: (url: string, options?: { visualAnalysis?: boolean; seoAnalysis?: boolean }) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
}

export interface ResultDisplayProps {
  result: AnalysisResult | null;
  loading: boolean;
  error?: string | null;
}

export interface HistoryTableProps {
  history: URLAnalysis[];
  onRerun: (url: string) => void;
  onDelete: (id: string) => void;
  onView: (analysis: URLAnalysis) => void;
  loading: boolean;
}

export interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (credentials: LoginCredentials | SignupCredentials) => Promise<void>;
  loading: boolean;
  error?: string | null;
}

// API error type
export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

// Environment config type
export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  nodeEnv: string;
  isProduction: boolean;
}

// Re-export SEO types
export * from './seo';
