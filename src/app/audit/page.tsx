'use client';

// ============================================================================
// URL Lens - Audit Page
// Protected by NEXT_PUBLIC_UNDER_DEV feature flag
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Construction,
  Science,
  ArrowBack,
  History,
  Close,
  Language,
  List as ListIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Audit from '@/components/Audit';
import AuditHistoryTable from '@/components/AuditHistoryTable';
import { AuditResults } from '@/components/Audit';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { URLAuditResult, AuditSummary } from '@/types/audit';

// ============================================================================
// Types
// ============================================================================

interface AuditSession {
  id: string;
  mode: 'batch' | 'domain';
  domain: string | null;
  totalUrls: number;
  completedUrls: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  avgScore?: number;
  bestScore?: number;
}

interface AuditSessionDetail {
  id: string;
  mode: 'batch' | 'domain';
  domain: string | null;
  totalUrls: number;
  completedUrls: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  results: Array<{
    id: string;
    url: string;
    statusCode: number | null;
    finalUrl: string | null;
    scrapeScore: number | null;
    requiresJs: boolean;
    botProtections: string[];
    accessible: boolean;
    recommendation: string | null;
    blockedReason: string | null;
    contentType: string | null;
    responseTimeMs: number | null;
  }>;
  summary: {
    avgScore: number;
    bestScore: number;
    accessibleCount: number;
    blockedCount: number;
    jsRequiredCount: number;
  };
}

// ============================================================================
// Feature Flag Check
// ============================================================================

const isFeatureEnabled = process.env.NEXT_PUBLIC_UNDER_DEV === 'true';

// ============================================================================
// Coming Soon Component
// ============================================================================

function FeatureComingSoon() {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 500,
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Construction sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          URL Audit is currently in development. This feature will help you
          discover scrape-friendly entry points for domains that may have bot
          protection on their homepage.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          href="/dashboard"
          startIcon={<ArrowBack />}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

// ============================================================================
// Development Banner
// ============================================================================

function DevBanner() {
  return (
    <Alert
      severity="warning"
      icon={<Science />}
      sx={{
        mb: 3,
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <AlertTitle>Development Feature</AlertTitle>
      <Typography variant="body2">
        URL Audit is currently in development. Features may change and some
        functionality may be incomplete.
      </Typography>
    </Alert>
  );
}

// ============================================================================
// Helper: Convert API response to AuditResults format
// ============================================================================

function convertToAuditResults(detail: AuditSessionDetail): {
  results: URLAuditResult[];
  summary: AuditSummary;
} {
  const results: URLAuditResult[] = detail.results.map((r) => ({
    url: r.url,
    status: r.statusCode || 0,
    finalUrl: r.finalUrl || r.url,
    accessible: r.accessible,
    jsRequired: r.requiresJs,
    botProtections: r.botProtections,
    scrapeLikelihoodScore: r.scrapeScore || 0,
    recommendation: (r.recommendation || 'Unknown') as URLAuditResult['recommendation'],
    redirects: 0,
    blockedReason: r.blockedReason || undefined,
    contentType: r.contentType || undefined,
    responseTimeMs: r.responseTimeMs || undefined,
  }));

  // Calculate recommendation breakdown
  const recommendationBreakdown = {
    best_entry_point: results.filter((r) => r.recommendation === 'Best Entry Point').length,
    good: results.filter((r) => r.recommendation === 'Good').length,
    moderate: results.filter((r) => r.recommendation === 'Moderate').length,
    challenging: results.filter((r) => r.recommendation === 'Challenging').length,
    blocked: results.filter((r) => r.recommendation === 'Blocked').length,
  };

  const summary: AuditSummary = {
    totalUrls: detail.totalUrls,
    accessibleCount: detail.summary.accessibleCount,
    blockedCount: detail.summary.blockedCount,
    averageScore: detail.summary.avgScore,
    jsRequiredCount: detail.summary.jsRequiredCount,
    bestEntryPoints: results
      .filter((r) => r.recommendation === 'Best Entry Point')
      .sort((a, b) => b.scrapeLikelihoodScore - a.scrapeLikelihoodScore)
      .slice(0, 5),
    recommendationBreakdown,
  };

  return { results, summary };
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditHistory, setAuditHistory] = useState<AuditSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AuditSession | null>(null);
  const [sessionDetail, setSessionDetail] = useState<AuditSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch audit history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/audit/history');
      const data = await response.json();
      if (data.success) {
        setAuditHistory(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching audit history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?redirect=/audit');
          return;
        }

        setUser({ email: user.email || '' });
        fetchHistory();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/audit');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, fetchHistory]);

  // Fetch session detail
  const fetchSessionDetail = useCallback(async (sessionId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/audit/history/${sessionId}`);
      const data = await response.json();
      if (data.success && data.session) {
        setSessionDetail(data.session);
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to load audit details' });
        setDetailDialogOpen(false);
      }
    } catch (error) {
      console.error('Error fetching session detail:', error);
      setSnackbar({ open: true, message: 'Failed to load audit details' });
      setDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // View audit session details
  const handleViewSession = (session: AuditSession) => {
    setSelectedSession(session);
    setSessionDetail(null);
    setDetailDialogOpen(true);
    fetchSessionDetail(session.id);
  };

  // Close detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedSession(null);
    setSessionDetail(null);
  };

  // Delete audit session
  const handleDeleteSession = async (id: string) => {
    try {
      const response = await fetch(`/api/audit/history/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setAuditHistory(prev => prev.filter(s => s.id !== id));
        setSnackbar({ open: true, message: 'Audit deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting audit:', error);
      setSnackbar({ open: true, message: 'Failed to delete audit' });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header user={null} />
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Show coming soon if feature is disabled
  if (!isFeatureEnabled) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header user={user} />
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          <FeatureComingSoon />
        </Container>
      </Box>
    );
  }

  // Show the audit feature
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header user={user} />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Development Banner */}
        <DevBanner />

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            URL Audit
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Audit URLs to discover scrape-friendly entry points. Find accessible pages even when the root domain is protected.
          </Typography>
        </Box>

        {/* Main Audit Component */}
        <Audit />

        {/* Audit History Section */}
        <Box sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <History color="action" />
            <Typography variant="h5" fontWeight={600}>
              Audit History
            </Typography>
          </Box>
          <AuditHistoryTable
            sessions={auditHistory}
            loading={historyLoading}
            onView={handleViewSession}
            onDelete={handleDeleteSession}
          />
        </Box>
      </Container>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedSession?.mode === 'domain' ? (
              <Language color="primary" />
            ) : (
              <ListIcon color="primary" />
            )}
            <Box>
              <Typography variant="h6" component="span">
                {selectedSession?.domain || `Batch Audit (${selectedSession?.totalUrls} URLs)`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={selectedSession?.mode === 'domain' ? 'Domain' : 'Batch'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={selectedSession?.status}
                  size="small"
                  color={selectedSession?.status === 'completed' ? 'success' : 'default'}
                />
                {selectedSession?.createdAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {new Date(selectedSession.createdAt).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleCloseDetail} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : sessionDetail ? (
            (() => {
              const { results, summary } = convertToAuditResults(sessionDetail);
              return <AuditResults results={results} summary={summary} />;
            })()
          ) : (
            <Alert severity="error">Failed to load audit details</Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
