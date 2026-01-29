'use client';

// ============================================================================
// URL Lens - Shared Footer Component
// ============================================================================

import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        mt: 'auto',
        borderTop: '1px solid #e2e8f0',
        bgcolor: 'white',
      }}
    >
      <Container maxWidth="lg">
        {/* Trust Links */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/privacy"
            style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Terms of Service
          </Link>
          <Link
            href="/about"
            style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Contact
          </Link>
          <Link
            href="/features"
            style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Features
          </Link>
        </Box>
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} URL Lens. Built by{' '}
          <Link
            href="/about"
            style={{ color: '#2563eb', textDecoration: 'none' }}
          >
            John Doe
          </Link>
          {' '}for web scraping enthusiasts.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ display: 'block', mt: 1 }}
        >
          Contact: contact@galasar.com
        </Typography>
      </Container>
    </Box>
  );
}
