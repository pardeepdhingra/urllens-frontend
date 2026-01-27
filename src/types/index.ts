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
}

// API request/response types
export interface AnalyzeRequest {
  url: string;
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
  onAnalyze: (url: string) => Promise<void>;
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
