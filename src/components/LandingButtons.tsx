// ============================================================================
// URL Lens - Landing Page Buttons (Client Component)
// ============================================================================

'use client';

import { Box } from '@mui/material';
import Link from 'next/link';

interface LandingButtonsProps {
  isLoggedIn: boolean;
  variant?: 'hero' | 'cta';
}

// Custom styled link that looks like a button
const buttonBaseStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: 1.75,
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  borderRadius: '8px',
  transition: 'background-color 250ms, box-shadow 250ms, border-color 250ms',
};

export function LandingButtons({ isLoggedIn, variant = 'hero' }: LandingButtonsProps) {
  if (variant === 'cta') {
    return (
      <Link
        href={isLoggedIn ? '/dashboard' : '/signup'}
        style={{
          ...buttonBaseStyles,
          padding: '12px 48px',
          backgroundColor: '#2563eb',
          color: 'white',
          boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
        }}
      >
        {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
      </Link>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Link
        href={isLoggedIn ? '/dashboard' : '/signup'}
        style={{
          ...buttonBaseStyles,
          padding: '12px 32px',
          backgroundColor: 'white',
          color: '#2563eb',
        }}
      >
        {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
      </Link>
      {!isLoggedIn && (
        <Link
          href="/login"
          style={{
            ...buttonBaseStyles,
            padding: '12px 32px',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid white',
          }}
        >
          Sign In
        </Link>
      )}
    </Box>
  );
}
