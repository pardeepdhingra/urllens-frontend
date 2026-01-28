'use client';

// ============================================================================
// URL Lens - Audit Page
// Protected by NEXT_PUBLIC_UNDER_DEV feature flag
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Construction,
  Science,
  ArrowBack,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Audit from '@/components/Audit';
import { getSupabaseClient } from '@/lib/supabase/client';

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
// Main Page Component
// ============================================================================

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to login if not authenticated
          router.push('/login?redirect=/audit');
          return;
        }

        setUser({ email: user.email || '' });
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/audit');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
      </Container>
    </Box>
  );
}
