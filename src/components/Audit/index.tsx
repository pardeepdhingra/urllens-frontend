'use client';

// ============================================================================
// URL Lens - Audit Component
// Main audit orchestrator component
// ============================================================================

import { useState, useCallback } from 'react';
import { Box, Alert, AlertTitle, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
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

type AuditState = 'idle' | 'running' | 'completed' | 'error';

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

  const handleStartAudit = useCallback(
    async (mode: AuditMode, data: { urls?: string[]; domain?: string }) => {
      setState('running');
      setError(null);
      setResults(null);
      setSummary(null);

      // Set initial progress
      setProgress({
        status: mode === 'domain' ? 'discovering' : 'testing',
        currentStep: mode === 'domain' ? 'Discovering URLs...' : 'Starting audit...',
        totalUrls: data.urls?.length || 0,
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
            mode,
            urls: data.urls,
            domain: data.domain,
          }),
        });

        // Parse response carefully
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

        // Update with final results
        if (result.results && result.summary) {
          setResults(result.results);
          setSummary(result.summary);
          setProgress({
            status: 'completed',
            currentStep: 'Audit complete',
            totalUrls: result.results.length,
            completedUrls: result.results.length,
            percentComplete: 100,
            discoveredUrls: result.discovery?.discoveredUrls.length,
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
    },
    []
  );

  const handleReset = () => {
    setState('idle');
    setResults(null);
    setSummary(null);
    setError(null);
    setProgress({
      status: 'pending',
      currentStep: '',
      totalUrls: 0,
      completedUrls: 0,
      percentComplete: 0,
    });
  };

  return (
    <Box>
      {/* Input Section - always visible when idle */}
      {state === 'idle' && (
        <AuditInput
          onStartAudit={handleStartAudit}
          loading={false}
          disabled={false}
        />
      )}

      {/* Progress Section */}
      {(state === 'running' || state === 'error') && (
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
