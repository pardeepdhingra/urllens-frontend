// ============================================================================
// URL Lens - Landing Page Buttons (Client Component)
// ============================================================================

'use client';

import { Box, Button } from '@mui/material';
import Link from 'next/link';

interface LandingButtonsProps {
  isLoggedIn: boolean;
  variant?: 'hero' | 'cta';
}

export function LandingButtons({ isLoggedIn, variant = 'hero' }: LandingButtonsProps) {
  if (variant === 'cta') {
    return (
      <Button
        component={Link}
        href={isLoggedIn ? '/dashboard' : '/signup'}
        variant="contained"
        size="large"
        sx={{ px: 6, py: 1.5 }}
      >
        {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Button
        component={Link}
        href={isLoggedIn ? '/dashboard' : '/signup'}
        variant="contained"
        size="large"
        sx={{
          bgcolor: 'white',
          color: 'primary.main',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.9)',
          },
          px: 4,
          py: 1.5,
        }}
      >
        {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
      </Button>
      {!isLoggedIn && (
        <Button
          component={Link}
          href="/login"
          variant="outlined"
          size="large"
          sx={{
            borderColor: 'white',
            color: 'white',
            '&:hover': {
              borderColor: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
            },
            px: 4,
            py: 1.5,
          }}
        >
          Sign In
        </Button>
      )}
    </Box>
  );
}
