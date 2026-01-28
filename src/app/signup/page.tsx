'use client';

// ============================================================================
// URL Lens - Signup Page
// ============================================================================

import { useState } from 'react';
import { Box, Container, Paper, Alert, Typography, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { AuthForm, Header } from '@/components';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { SignupCredentials } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (credentials: SignupCredentials) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = getSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (signUpError.message.includes('Password')) {
          setError('Password must be at least 8 characters long.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // For development without email confirmation, redirect to dashboard
      // In production with email confirmation, show success message
      setSuccess(true);

      // Try to sign in immediately (works if email confirmation is disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (!signInError) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Free Tier Banner */}
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Chip
            label="100% FREE"
            sx={{
              bgcolor: 'white',
              color: '#16a34a',
              fontWeight: 700,
              fontSize: '0.875rem',
              mb: 2,
            }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Credit Card Required
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 18 }} />
              <Typography variant="body2">Unlimited URL analyses</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 18 }} />
              <Typography variant="body2">Full SEO/AEO/GEO/LLMO reports</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 18 }} />
              <Typography variant="body2">Shareable analysis links</Typography>
            </Box>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: '1px solid #e2e8f0',
          }}
        >
          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Account created successfully! Check your email to confirm your account,
              or if email confirmation is disabled, you will be redirected to the dashboard.
            </Alert>
          ) : null}

          <AuthForm
            mode="signup"
            onSubmit={handleSignup}
            loading={loading}
            error={error}
          />
        </Paper>
      </Container>
    </Box>
  );
}
