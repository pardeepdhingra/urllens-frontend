'use client';

// ============================================================================
// URL Lens - Login Page
// ============================================================================

import { useState } from 'react';
import { Box, Container, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AuthForm, Header } from '@/components';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { LoginCredentials } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: '1px solid #e2e8f0',
          }}
        >
          <AuthForm
            mode="login"
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />
        </Paper>
      </Container>
    </Box>
  );
}
