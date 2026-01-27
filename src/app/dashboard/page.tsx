'use client';

// ============================================================================
// URL Lens - Dashboard Page
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import { Header, URLInput, ResultDisplay, HistoryTable } from '@/components';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { URLAnalysis, AnalysisResult } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<URLAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email || '' });
      }
    };
    fetchUser();
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (data.success) {
        setHistory(data.data || []);
      } else {
        console.error('Failed to fetch history:', data.error);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Analyze URL
  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed');
        setSnackbar({
          open: true,
          message: data.error || 'Analysis failed',
          severity: 'error',
        });
        return;
      }

      // Map the response to AnalysisResult format
      const analysisResult: AnalysisResult = {
        url: data.data.url,
        final_url: data.data.final_url,
        status: data.data.status,
        redirects: data.data.redirects,
        js_hints: data.data.js_hints,
        bot_protections: data.data.bot_protections,
        score: data.data.score,
        recommendation: data.data.recommendation,
        response_time_ms: 0, // Not stored in DB
      };

      setResult(analysisResult);
      setSnackbar({
        open: true,
        message: 'URL analyzed successfully!',
        severity: 'success',
      });

      // Refresh history
      fetchHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-run analysis
  const handleRerun = (url: string) => {
    handleAnalyze(url);
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete history item
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        setSnackbar({
          open: true,
          message: 'Record deleted successfully',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to delete record',
          severity: 'error',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete record',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header user={user} />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            URL Analyzer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter a URL to analyze its scrapability and detect bot protections.
          </Typography>
        </Box>

        {/* URL Input Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
          }}
        >
          <URLInput onAnalyze={handleAnalyze} loading={loading} />
        </Paper>

        {/* Results Section */}
        {(result || loading || error) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Analysis Result
            </Typography>
            <ResultDisplay
              result={result}
              loading={loading}
              error={error}
            />
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* History Section */}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Analysis History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your recent URL analyses are saved here. Re-run or delete as needed.
          </Typography>
          <HistoryTable
            history={history}
            onRerun={handleRerun}
            onDelete={handleDelete}
            loading={historyLoading}
          />
        </Box>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
