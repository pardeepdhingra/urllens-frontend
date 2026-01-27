// ============================================================================
// URL Lens - SEO Analyzer Main Orchestrator
// Coordinates all SEO/AEO/GEO/LLMO analysis modules
// ============================================================================

import { analyzeHTML } from './htmlAnalyzer';
import { analyzeStructuredData } from './structuredDataAnalyzer';
import { analyzeContentQuality } from './contentAnalyzer';
import {
  calculateSEOScore,
  calculateAEOScore,
  calculateGEOScore,
  calculateLLMOScore,
} from './scoringEngines';
import type {
  SEOAnalysisResult,
  SEORecommendation,
  SEOScore,
  AEOScore,
  GEOScore,
  LLMOScore,
  ScoreIssue,
} from '@/types/seo';

// Analysis version for tracking
const ANALYSIS_VERSION = '1.0.0';

/**
 * Main SEO analysis function
 * Analyzes a URL's HTML content for SEO, AEO, GEO, and LLMO optimization
 */
export async function analyzeSEO(
  url: string,
  html: string,
  responseTimeMs: number = 0
): Promise<SEOAnalysisResult> {
  const startTime = Date.now();

  // Run all analyzers
  const htmlAnalysis = analyzeHTML(html, url);
  const structuredData = analyzeStructuredData(html);
  const contentQuality = analyzeContentQuality(html);

  // Calculate individual scores
  const seoScore = calculateSEOScore(htmlAnalysis, structuredData, responseTimeMs);
  const aeoScore = calculateAEOScore(htmlAnalysis, structuredData, contentQuality);
  const geoScore = calculateGEOScore(htmlAnalysis, structuredData, contentQuality);
  const llmoScore = calculateLLMOScore(htmlAnalysis, structuredData, contentQuality);

  // Generate sorted recommendations (lowest score first)
  const recommendations = generateRecommendations(seoScore, aeoScore, geoScore, llmoScore);

  const analysisDurationMs = Date.now() - startTime;

  return {
    seo: seoScore,
    aeo: aeoScore,
    geo: geoScore,
    llmo: llmoScore,
    htmlAnalysis,
    structuredData,
    contentQuality,
    recommendations,
    url,
    analyzedAt: new Date().toISOString(),
    analysisVersion: ANALYSIS_VERSION,
    analysisDurationMs,
  };
}

/**
 * Generate sorted recommendations from all scores
 * Sorted by: lowest score category first, then by priority within category
 */
function generateRecommendations(
  seo: SEOScore,
  aeo: AEOScore,
  geo: GEOScore,
  llmo: LLMOScore
): SEORecommendation[] {
  const recommendations: SEORecommendation[] = [];

  // Collect all issues with their category info
  const allIssues: Array<{
    category: 'seo' | 'aeo' | 'geo' | 'llmo';
    score: number;
    issue: ScoreIssue;
  }> = [
    ...seo.issues.map(issue => ({ category: 'seo' as const, score: seo.score, issue })),
    ...aeo.issues.map(issue => ({ category: 'aeo' as const, score: aeo.score, issue })),
    ...geo.issues.map(issue => ({ category: 'geo' as const, score: geo.score, issue })),
    ...llmo.issues.map(issue => ({ category: 'llmo' as const, score: llmo.score, issue })),
  ];

  // Sort by: category score (ascending), then priority
  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  allIssues.sort((a, b) => {
    // First sort by category score (lowest first)
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    // Then by priority
    return priorityOrder[a.issue.priority] - priorityOrder[b.issue.priority];
  });

  // Convert to recommendations
  for (const { category, issue } of allIssues) {
    recommendations.push({
      id: issue.id,
      category,
      priority: issue.priority,
      title: issue.factor,
      description: issue.description,
      pointsGain: issue.points,
      howToFix: issue.howToFix,
      learnMoreUrl: issue.learnMoreUrl,
    });
  }

  return recommendations;
}

/**
 * Get a summary of the SEO analysis for display
 */
export function getSEOAnalysisSummary(result: SEOAnalysisResult): {
  lowestScore: { category: string; score: number; grade: string };
  highestScore: { category: string; score: number; grade: string };
  criticalIssues: number;
  totalIssues: number;
} {
  const scores = [
    { category: 'SEO', score: result.seo.score, grade: result.seo.grade },
    { category: 'AEO', score: result.aeo.score, grade: result.aeo.grade },
    { category: 'GEO', score: result.geo.score, grade: result.geo.grade },
    { category: 'LLMO', score: result.llmo.score, grade: result.llmo.grade },
  ];

  scores.sort((a, b) => a.score - b.score);

  const criticalIssues = result.recommendations.filter(r => r.priority === 'critical').length;
  const totalIssues = result.recommendations.length;

  return {
    lowestScore: scores[0],
    highestScore: scores[scores.length - 1],
    criticalIssues,
    totalIssues,
  };
}

/**
 * Get category label with emoji
 */
export function getCategoryLabel(category: 'seo' | 'aeo' | 'geo' | 'llmo'): string {
  const labels: Record<string, string> = {
    seo: 'SEO (Search Engine Optimization)',
    aeo: 'AEO (Answer Engine Optimization)',
    geo: 'GEO (Generative Engine Optimization)',
    llmo: 'LLMO (LLM Optimization)',
  };
  return labels[category] || category.toUpperCase();
}

/**
 * Get score status emoji
 */
export function getScoreStatusEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

/**
 * Get priority emoji
 */
export function getPriorityEmoji(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  const emojis: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return emojis[priority] || '⚪';
}

// Re-export types and helpers
export * from '@/types/seo';
export { analyzeHTML } from './htmlAnalyzer';
export { analyzeStructuredData } from './structuredDataAnalyzer';
export { analyzeContentQuality } from './contentAnalyzer';
