// ============================================================================
// URL Lens - UTM & Query Parameter Analyzer
// Tracks how URL parameters flow through redirect chains
// ============================================================================

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

export interface UTMAnalysisResult {
  // Overall summary
  hasUtmParams: boolean;
  utmPreserved: boolean;
  allParamsPreserved: boolean;

  // UTM specific tracking
  initialUtmParams: Record<string, string>;
  finalUtmParams: Record<string, string>;
  utmLostAt?: number; // Step where UTMs were lost

  // All parameters tracking
  initialParams: Record<string, string>;
  finalParams: Record<string, string>;

  // Per-step analysis
  parameterFlow: RedirectParameterState[];

  // Summary of changes
  paramsAdded: string[];
  paramsRemoved: string[];
  paramsModified: string[];

  // Recommendations
  issues: UTMIssue[];
}

export interface UTMIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedParams: string[];
  step?: number;
}

// Standard UTM parameters
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];

// Common tracking parameters (non-UTM)
const TRACKING_PARAMS = [
  // Facebook
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source',
  // Google
  'gclid', 'gclsrc', 'dclid',
  // Microsoft/Bing
  'msclkid',
  // Twitter
  'twclid',
  // TikTok
  'ttclid',
  // LinkedIn
  'li_fat_id',
  // Other common
  'ref', 'source', 'campaign', 'medium',
];

/**
 * Parse URL and extract all query parameters
 */
export function parseUrlParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Extract only UTM parameters from a params object
 */
export function extractUtmParams(params: Record<string, string>): Record<string, string> {
  const utmParams: Record<string, string> = {};
  for (const key of UTM_PARAMS) {
    if (params[key]) {
      utmParams[key] = params[key];
    }
  }
  return utmParams;
}

/**
 * Extract tracking parameters (UTM + other common tracking params)
 */
export function extractTrackingParams(params: Record<string, string>): Record<string, string> {
  const trackingParams: Record<string, string> = {};
  const allTrackingKeys = [...UTM_PARAMS, ...TRACKING_PARAMS];

  for (const key of Object.keys(params)) {
    if (allTrackingKeys.includes(key.toLowerCase())) {
      trackingParams[key] = params[key];
    }
  }
  return trackingParams;
}

/**
 * Compare two parameter objects and identify changes
 */
export function compareParams(
  before: Record<string, string>,
  after: Record<string, string>
): ParameterChange[] {
  const changes: ParameterChange[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];

    if (beforeVal && !afterVal) {
      changes.push({
        name: key,
        action: 'removed',
        originalValue: beforeVal,
      });
    } else if (!beforeVal && afterVal) {
      changes.push({
        name: key,
        action: 'added',
        newValue: afterVal,
      });
    } else if (beforeVal !== afterVal) {
      changes.push({
        name: key,
        action: 'modified',
        originalValue: beforeVal,
        newValue: afterVal,
      });
    } else {
      changes.push({
        name: key,
        action: 'preserved',
        originalValue: beforeVal,
        newValue: afterVal,
      });
    }
  }

  return changes;
}

/**
 * Check if an object has any UTM parameters
 */
export function hasUtmParams(params: Record<string, string>): boolean {
  return UTM_PARAMS.some(key => params[key] !== undefined);
}

/**
 * Check if UTM parameters are fully preserved between two states
 */
export function areUtmParamsPreserved(
  initial: Record<string, string>,
  final: Record<string, string>
): boolean {
  const initialUtm = extractUtmParams(initial);
  const finalUtm = extractUtmParams(final);

  // Check if all initial UTM params exist and have same values in final
  for (const key of Object.keys(initialUtm)) {
    if (finalUtm[key] !== initialUtm[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Analyze UTM and parameter flow through a redirect chain
 */
export function analyzeParameterFlow(urls: string[]): UTMAnalysisResult {
  if (urls.length === 0) {
    return {
      hasUtmParams: false,
      utmPreserved: true,
      allParamsPreserved: true,
      initialUtmParams: {},
      finalUtmParams: {},
      initialParams: {},
      finalParams: {},
      parameterFlow: [],
      paramsAdded: [],
      paramsRemoved: [],
      paramsModified: [],
      issues: [],
    };
  }

  const parameterFlow: RedirectParameterState[] = [];
  let previousParams: Record<string, string> = {};

  // Process each URL in the chain
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const currentParams = parseUrlParams(url);
    const utmParams = extractUtmParams(currentParams);
    const changes = i === 0 ? [] : compareParams(previousParams, currentParams);

    parameterFlow.push({
      step: i + 1,
      url,
      allParams: currentParams,
      utmParams,
      changes,
    });

    previousParams = currentParams;
  }

  const initialParams = parameterFlow[0]?.allParams || {};
  const finalParams = parameterFlow[parameterFlow.length - 1]?.allParams || {};
  const initialUtmParams = extractUtmParams(initialParams);
  const finalUtmParams = extractUtmParams(finalParams);

  // Calculate overall changes
  const allChanges = compareParams(initialParams, finalParams);
  const paramsAdded = allChanges.filter(c => c.action === 'added').map(c => c.name);
  const paramsRemoved = allChanges.filter(c => c.action === 'removed').map(c => c.name);
  const paramsModified = allChanges.filter(c => c.action === 'modified').map(c => c.name);

  // Find where UTM params were lost
  let utmLostAt: number | undefined;
  const hasInitialUtm = hasUtmParams(initialParams);

  if (hasInitialUtm) {
    for (let i = 1; i < parameterFlow.length; i++) {
      const prevUtm = parameterFlow[i - 1].utmParams;
      const currUtm = parameterFlow[i].utmParams;

      // Check if any UTM param was lost at this step
      for (const key of Object.keys(prevUtm)) {
        if (!currUtm[key]) {
          utmLostAt = i + 1;
          break;
        }
      }
      if (utmLostAt) break;
    }
  }

  // Generate issues/recommendations
  const issues: UTMIssue[] = [];

  // Check for lost UTM params
  const lostUtmParams = UTM_PARAMS.filter(
    key => initialParams[key] && !finalParams[key]
  );
  if (lostUtmParams.length > 0) {
    issues.push({
      severity: 'error',
      message: `UTM parameters lost during redirect: ${lostUtmParams.join(', ')}`,
      affectedParams: lostUtmParams,
      step: utmLostAt,
    });
  }

  // Check for modified UTM params
  const modifiedUtmParams = UTM_PARAMS.filter(
    key => initialParams[key] && finalParams[key] && initialParams[key] !== finalParams[key]
  );
  if (modifiedUtmParams.length > 0) {
    issues.push({
      severity: 'warning',
      message: `UTM parameters were modified: ${modifiedUtmParams.join(', ')}`,
      affectedParams: modifiedUtmParams,
    });
  }

  // Check for lost tracking params (non-UTM)
  const lostTrackingParams = TRACKING_PARAMS.filter(
    key => initialParams[key] && !finalParams[key]
  );
  if (lostTrackingParams.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Other tracking parameters lost: ${lostTrackingParams.join(', ')}`,
      affectedParams: lostTrackingParams,
    });
  }

  // Info about added params
  if (paramsAdded.length > 0) {
    issues.push({
      severity: 'info',
      message: `New parameters added during redirect: ${paramsAdded.join(', ')}`,
      affectedParams: paramsAdded,
    });
  }

  return {
    hasUtmParams: hasInitialUtm,
    utmPreserved: lostUtmParams.length === 0 && modifiedUtmParams.length === 0,
    allParamsPreserved: paramsRemoved.length === 0 && paramsModified.length === 0,
    initialUtmParams,
    finalUtmParams,
    utmLostAt,
    initialParams,
    finalParams,
    parameterFlow,
    paramsAdded,
    paramsRemoved,
    paramsModified,
    issues,
  };
}

/**
 * Format a URL with highlighted parameters for display
 */
export function formatUrlWithParams(url: string): { base: string; params: Array<{ key: string; value: string; isUtm: boolean }> } {
  try {
    const urlObj = new URL(url);
    const base = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    const params: Array<{ key: string; value: string; isUtm: boolean }> = [];

    urlObj.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        isUtm: UTM_PARAMS.includes(key.toLowerCase()),
      });
    });

    return { base, params };
  } catch {
    return { base: url, params: [] };
  }
}

/**
 * Generate a summary string for UTM analysis
 */
export function getUtmAnalysisSummary(result: UTMAnalysisResult): string {
  const parts: string[] = [];

  if (!result.hasUtmParams) {
    parts.push('No UTM parameters in initial URL.');
  } else if (result.utmPreserved) {
    parts.push('✓ All UTM parameters preserved through redirects.');
  } else {
    parts.push('⚠ UTM parameters were lost or modified.');
    if (result.utmLostAt) {
      parts.push(`Lost at step ${result.utmLostAt}.`);
    }
  }

  if (result.paramsRemoved.length > 0) {
    parts.push(`${result.paramsRemoved.length} parameter(s) removed.`);
  }

  if (result.paramsAdded.length > 0) {
    parts.push(`${result.paramsAdded.length} parameter(s) added.`);
  }

  return parts.join(' ');
}
