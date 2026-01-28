// ============================================================================
// URL Lens - Terms of Service
// ============================================================================

import { Box, Container, Typography } from '@mui/material';
import { Header, Footer } from '@/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'URL Lens Terms of Service - Rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Container component="article" maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h1" sx={{ fontSize: '2.5rem', fontWeight: 700, mb: 4 }}>
          Terms of Service
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Last updated: January 2026
        </Typography>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or using URL Lens, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            URL Lens is a URL analysis platform that provides:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li><Typography variant="body1">Scrapability analysis and scoring</Typography></li>
            <li><Typography variant="body1">Bot protection detection</Typography></li>
            <li><Typography variant="body1">SEO/AEO/GEO/LLMO optimization analysis</Typography></li>
            <li><Typography variant="body1">Redirect chain visualization</Typography></li>
            <li><Typography variant="body1">HTTP header inspection</Typography></li>
            <li><Typography variant="body1">Shareable analysis reports</Typography></li>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            3. Acceptable Use
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to use URL Lens only for lawful purposes. You may not:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li><Typography variant="body1">Use the service to violate any laws or regulations</Typography></li>
            <li><Typography variant="body1">Attempt to bypass our rate limits or security measures</Typography></li>
            <li><Typography variant="body1">Use the service to harm, harass, or infringe on others&apos; rights</Typography></li>
            <li><Typography variant="body1">Reverse engineer or attempt to extract source code</Typography></li>
            <li><Typography variant="body1">Resell or redistribute our services without permission</Typography></li>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            4. User Accounts
          </Typography>
          <Typography variant="body1" paragraph>
            You are responsible for maintaining the security of your account credentials.
            You must provide accurate information when creating an account and keep your
            contact information up to date.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            5. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            URL Lens and its original content, features, and functionality are owned by
            URL Lens and are protected by international copyright, trademark, and other
            intellectual property laws.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            6. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            URL Lens is provided &quot;as is&quot; without warranties of any kind. We are not liable
            for any indirect, incidental, or consequential damages arising from your use of
            the service. The analysis results are for informational purposes only.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            7. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to terminate or suspend your account at our discretion,
            without notice, for conduct that we believe violates these Terms or is harmful
            to other users or the service.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            8. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We may modify these Terms at any time. Continued use of the service after
            changes constitutes acceptance of the new Terms.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2 }}>
            9. Contact
          </Typography>
          <Typography variant="body1" paragraph>
            For questions about these Terms, contact us at:{' '}
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
