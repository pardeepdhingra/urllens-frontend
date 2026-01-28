'use client';

// ============================================================================
// URL Lens - Audit Component
// Main audit orchestrator component
// Two-step flow for domain mode: Discover URLs → Audit URLs
// ============================================================================

import { useState, useCallback } from 'react';
import { Box, Alert, AlertTitle, Button, Chip, Typography, Paper } from '@mui/material';
import { Refresh, Search } from '@mui/icons-material';
import AuditInput from './AuditInput';
import AuditProgress from './AuditProgress';
import AuditResults from './AuditResults';
import type {
  AuditMode,
  URLAuditResult,
  AuditSummary,
  AuditProgress as AuditProgressType,
  DomainDiscoveryResult,
} from '@/types/audit';

// ============================================================================
// Types
// ============================================================================

interface AuditResponse {
  success: boolean;
  sessionId?: string;
  results?: URLAuditResult[];
  discovery?: DomainDiscoveryResult;
  summary?: AuditSummary;
  error?: string;
}

interface DiscoverResponse {
  success: boolean;
  discovery?: DomainDiscoveryResult;
  error?: string;
}

type AuditState = 'idle' | 'discovering' | 'discovered' | 'running' | 'completed' | 'error';

// ============================================================================
// Component
// ============================================================================

export default function Audit() {
  const [state, setState] = useState<AuditState>('idle');
  const [progress, setProgress] = useState<AuditProgressType>({
    status: 'pending',
    currentStep: '',
    totalUrls: 0,
    completedUrls: 0,
    percentComplete: 0,
  });
  const [results, setResults] = useState<URLAuditResult[] | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discovery, setDiscovery] = useState<DomainDiscoveryResult | null>(null);

  // ============================================================================
  // Discover URLs (step 1 for domain mode)
  // ============================================================================

  const handleDiscoverUrls = useCallback(async (domain: string) => {
    setState('discovering');
    setError(null);
    setDiscovery(null);
    setResults(null);
    setSummary(null);

    setProgress({
      status: 'discovering',
      currentStep: 'Discovering URLs from sitemaps, robots.txt, and common paths...',
      totalUrls: 0,
      completedUrls: 0,
      percentComplete: 0,
    });

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let result: DiscoverResponse;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!result.success) {
        throw new Error(result.error || 'Discovery failed');
      }

      if (!result.discovery || result.discovery.discoveredUrls.length === 0) {
        throw new Error('No URLs discovered for this domain');
      }

      // Save discovery results and transition to discovered state
      setDiscovery(result.discovery);
      setProgress({
        status: 'pending',
        currentStep: `Found ${result.discovery.discoveredUrls.length} URLs`,
        totalUrls: result.discovery.discoveredUrls.length,
        completedUrls: 0,
        percentComplete: 0,
        discoveredUrls: result.discovery.discoveredUrls.length,
      });
      setState('discovered');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        currentStep: 'Discovery failed',
      }));
      setState('error');
    }
  }, []);

  // ============================================================================
  // Run Audit (step 2 - uses batch mode with discovered/provided URLs)
  // ============================================================================

  const handleRunAudit = useCallback(async (urls: string[]) => {
    setState('running');
    setError(null);
    setResults(null);
    setSummary(null);

    setProgress({
      status: 'testing',
      currentStep: 'Starting audit...',
      totalUrls: urls.length,
      completedUrls: 0,
      percentComplete: 0,
    });

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'batch',
          urls,
        }),
      });

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let result: AuditResponse;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!result.success) {
        throw new Error(result.error || 'Audit failed');
      }

      if (result.results && result.summary) {
        setResults(result.results);
        setSummary(result.summary);
        setProgress({
          status: 'completed',
          currentStep: 'Audit complete',
          totalUrls: result.results.length,
          completedUrls: result.results.length,
          percentComplete: 100,
          discoveredUrls: discovery?.discoveredUrls.length,
        });
        setState('completed');
      } else {
        throw new Error('No results returned from audit');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        currentStep: 'Audit failed',
      }));
      setState('error');
    }
  }, [discovery]);

  // ============================================================================
  // Start Audit Handler (called from AuditInput)
  // ============================================================================

  const handleStartAudit = useCallback(
    async (mode: AuditMode, data: { urls?: string[]; domain?: string }) => {
      if (mode === 'domain' && data.domain) {
        // Two-step flow: first discover, then user confirms to audit
        await handleDiscoverUrls(data.domain);
      } else if (data.urls) {
        // Direct batch mode: audit immediately
        await handleRunAudit(data.urls);
      }
    },
    [handleDiscoverUrls, handleRunAudit]
  );

  // ============================================================================
  // Confirm Audit (after discovery)
  // ============================================================================

  const handleConfirmAudit = useCallback(() => {
    if (discovery) {
      const urls = discovery.discoveredUrls.map((u) => u.url);
      handleRunAudit(urls);
    }
  }, [discovery, handleRunAudit]);

  // ============================================================================
  // Reset
  // ============================================================================

  const handleReset = () => {
    setState('idle');
    setResults(null);
    setSummary(null);
    setError(null);
    setDiscovery(null);
    setProgress({
      status: 'pending',
      currentStep: '',
      totalUrls: 0,
      completedUrls: 0,
      percentComplete: 0,
    });
  };

  // ============================================================================
  // Render Helper: Discovery Summary
  // ============================================================================

  const renderDiscoverySummary = () => {
    if (!discovery) return null;

    const sourceTypes = discovery.sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + source.urlsFound;
      return acc;
    }, {} as Record<string, number>);

    return (
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Discovery Results for {discovery.domain}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={`${discovery.discoveredUrls.length} URLs found`}
                color="primary"
                size="small"
              />
              <Chip
                label={discovery.rootAccessible ? 'Root accessible' : 'Root blocked'}
                color={discovery.rootAccessible ? 'success' : 'warning'}
                size="small"
                variant="outlined"
              />
              {Object.entries(sourceTypes).map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${count} from ${type.replace('_', ' ')}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleReset}
          >
            Start Over
          </Button>
        </Box>

        {/* URL Preview */}
        <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, backgroundColor: 'grey.50', borderRadius: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            URLs to audit (showing first 20):
          </Typography>
          {discovery.discoveredUrls.slice(0, 20).map((url, idx) => (
            <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {url.url}
            </Typography>
          ))}
          {discovery.discoveredUrls.length > 20 && (
            <Typography variant="caption" color="text.secondary">
              ... and {discovery.discoveredUrls.length - 20} more
            </Typography>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Search />}
            onClick={handleConfirmAudit}
          >
            Audit {discovery.discoveredUrls.length} URLs
          </Button>
        </Box>
      </Paper>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Box>
      {/* Input Section - visible when idle */}
      {state === 'idle' && (
        <AuditInput
          onStartAudit={handleStartAudit}
          loading={false}
          disabled={false}
        />
      )}

      {/* Discovery Progress */}
      {state === 'discovering' && (
        <Box sx={{ mb: 3 }}>
          <AuditProgress progress={progress} />
        </Box>
      )}

      {/* Discovery Results - show discovered URLs and confirm button */}
      {state === 'discovered' && discovery && (
        renderDiscoverySummary()
      )}

      {/* Audit Progress */}
      {(state === 'running' || (state === 'error' && discovery)) && (
        <Box sx={{ mb: 3 }}>
          <AuditProgress progress={progress} error={error} />

          {state === 'error' && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
              >
                Try Again
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Error State (when no discovery) */}
      {state === 'error' && !discovery && (
        <Box sx={{ mb: 3 }}>
          <AuditProgress progress={progress} error={error} />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
            >
              Try Again
            </Button>
          </Box>
        </Box>
      )}

      {/* Results Section */}
      {state === 'completed' && results && summary && (
        <Box>
          {/* Success Progress */}
          <Box sx={{ mb: 3 }}>
            <AuditProgress progress={progress} />
          </Box>

          {/* New Audit Button */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
            >
              New Audit
            </Button>
          </Box>

          {/* Results Table */}
          <AuditResults results={results} summary={summary} />
        </Box>
      )}

      {/* Feature Info Alert */}
      {state === 'idle' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>About URL Audit</AlertTitle>
          URL Audit helps you discover scrape-friendly entry points for domains that may have bot protection on their homepage.
          It analyzes HTTP status, JavaScript requirements, bot protection mechanisms, and redirect chains to calculate a scrape likelihood score.
        </Alert>
      )}
    </Box>
  );
}

// Export sub-components
export { default as AuditInput } from './AuditInput';
export { default as AuditProgress } from './AuditProgress';
export { default as AuditResults } from './AuditResults';
