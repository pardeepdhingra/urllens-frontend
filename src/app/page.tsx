// ============================================================================
// URL Lens - Landing Page
// ============================================================================

import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Speed,
  Shield,
  Code,
  TrendingUp,
  Search,
  History,
} from '@mui/icons-material';
import { Header } from '@/components';
import { getServerUser } from '@/lib/supabase/server';
import { LandingButtons } from '@/components/LandingButtons';

const features = [
  {
    icon: Speed,
    title: 'Fast Analysis',
    description: 'Get instant insights about any URL in seconds, including response times and redirect chains.',
  },
  {
    icon: Shield,
    title: 'Bot Protection Detection',
    description: 'Identify Cloudflare, reCAPTCHA, DataDome, and other anti-bot measures.',
  },
  {
    icon: Code,
    title: 'JavaScript Detection',
    description: 'Know if a page requires JavaScript rendering for content access.',
  },
  {
    icon: TrendingUp,
    title: 'Scrapability Score',
    description: 'Get a clear 0-100 score indicating how easy a URL is to scrape.',
  },
  {
    icon: Search,
    title: 'Detailed Reports',
    description: 'Comprehensive analysis with actionable recommendations for your scraping strategy.',
  },
  {
    icon: History,
    title: 'Analysis History',
    description: 'Track all your analyses and quickly re-run previous checks.',
  },
];

export default async function LandingPage() {
  const user = await getServerUser();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header user={user ? { email: user.email || '' } : null} />

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                Analyze URL Scrapability
                <br />
                in Seconds
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 400,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                }}
              >
                Instantly detect bot protections, JavaScript requirements, and get
                actionable scraping recommendations for any URL.
              </Typography>
              <LandingButtons isLoggedIn={!!user} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  p: 3,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                  >
                    https://example.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: '#22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h5" fontWeight={700} color="white">
                      92
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Excellent Scrapability
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      No bot protection detected
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h2"
          align="center"
          sx={{ mb: 2, fontWeight: 700 }}
        >
          Powerful URL Analysis
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Everything you need to understand and plan your web scraping strategy
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <feature.icon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Ready to Start?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create your free account and start analyzing URLs today.
          </Typography>
          <LandingButtons isLoggedIn={!!user} variant="cta" />
        </Container>
      </Box>

      {/* Footer */}
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
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} URL Lens. Built for web scraping enthusiasts.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
