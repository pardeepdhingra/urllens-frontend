// ============================================================================
// URL Lens - Privacy Policy
// ============================================================================

import { Box, Container, Typography } from '@mui/material';
import { Header, Footer } from '@/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'URL Lens Privacy Policy - Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container component="article" maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h1" sx={{ fontSize: '2.5rem', fontWeight: 700, mb: 4 }}>
          Privacy Policy
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Last updated: January 2026
        </Typography>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            URL Lens collects minimal information necessary to provide our services:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li><Typography variant="body1">Email address (for account creation)</Typography></li>
            <li><Typography variant="body1">URLs you analyze (stored for your history)</Typography></li>
            <li><Typography variant="body1">Analysis results and reports</Typography></li>
            <li><Typography variant="body1">Usage data and analytics</Typography></li>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the collected information to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li><Typography variant="body1">Provide and maintain our URL analysis services</Typography></li>
            <li><Typography variant="body1">Store your analysis history for your convenience</Typography></li>
            <li><Typography variant="body1">Generate shareable reports when requested</Typography></li>
            <li><Typography variant="body1">Improve our services and user experience</Typography></li>
            <li><Typography variant="body1">Send important service updates</Typography></li>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            3. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement industry-standard security measures to protect your data, including encrypted
            connections (HTTPS), secure database storage, and regular security audits. Your password
            is hashed and never stored in plain text.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            4. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We retain your analysis history for as long as you maintain an active account. You can
            delete your account and associated data at any time by contacting us.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            5. Third-Party Services
          </Typography>
          <Typography variant="body1" paragraph>
            URL Lens uses the following third-party services:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li><Typography variant="body1">Supabase (authentication and database)</Typography></li>
            <li><Typography variant="body1">Vercel (hosting and analytics)</Typography></li>
            <li><Typography variant="body1">Browserless.io (visual analysis screenshots)</Typography></li>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            6. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to access, correct, or delete your personal data. You can also
            request a copy of your data or opt out of non-essential communications.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            7. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:pardeep@galasar.com" style={{ color: '#2563eb' }}>
              pardeep@galasar.com
            </a>
          </Typography>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
