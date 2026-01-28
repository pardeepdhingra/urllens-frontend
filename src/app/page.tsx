// ============================================================================
// URL Lens - Landing Page
// ============================================================================

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic';

import { Box, Container, Typography, Card, CardContent, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Speed,
  Shield,
  CameraAlt,
  Analytics,
  Link as LinkIcon,
  Share,
  Storage,
  Security,
  TrendingUp,
  Search,
  CheckCircle,
  FormatQuote,
} from '@mui/icons-material';
import { Header, FAQSection, Footer } from '@/components';
import { faqData } from '@/lib/faqData';
import { getServerUser } from '@/lib/supabase/server';
import { LandingButtons } from '@/components/LandingButtons';
import Link from 'next/link';

// Platform statistics - updated monthly
const platformStats = {
  urlsAnalyzed: '10,000+',
  accuracyRate: '98%',
  avgResponseTime: '2.3s',
  botProtectionTypes: 15,
  countriesServed: 45,
  uptime: '99.9%',
};

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
    icon: CameraAlt,
    title: 'Visual Redirect Timeline',
    description: 'See screenshots at each redirect hop to visualize the complete journey.',
  },
  {
    icon: Analytics,
    title: 'SEO/AEO/GEO/LLMO Analysis',
    description: 'Get scores for Search, Answer, Generative, and LLM optimization.',
  },
  {
    icon: LinkIcon,
    title: 'UTM & Parameter Tracking',
    description: 'Track how URL parameters change through redirects for marketing attribution.',
  },
  {
    icon: Storage,
    title: 'Headers & robots.txt',
    description: 'Inspect HTTP headers and robots.txt rules affecting crawler access.',
  },
  {
    icon: Security,
    title: 'Rate Limit Detection',
    description: 'Identify rate limiting headers and understand scraping constraints.',
  },
  {
    icon: TrendingUp,
    title: 'Scrapability Score',
    description: 'Get a clear 0-100 score indicating how easy a URL is to scrape.',
  },
  {
    icon: Share,
    title: 'Shareable Reports',
    description: 'Generate shareable links to collaborate with your team.',
  },
];

export default async function LandingPage() {
  const user = await getServerUser();

  return (
    <Box
      component="main"
      sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      role="main"
    >
      <Header user={user ? { email: user.email || '' } : null} />

      {/* Hero Section */}
      <Box
        component="section"
        aria-label="Hero"
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
                The Complete URL
                <br />
                Analysis Platform
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
                Analyze scrapability, SEO optimization, redirect chains, bot protections,
                and more. Get actionable insights with visual reports and shareable links.
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

      {/* Statistics Section */}
      <Box
        component="section"
        aria-label="Platform Statistics"
        sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 8 } }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            sx={{ mb: 1, fontWeight: 700 }}
          >
            Trusted by Developers Worldwide
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 5, maxWidth: 600, mx: 'auto' }}
          >
            Real-time data from our platform performance metrics
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: 'primary.main' }}>
                  {platformStats.urlsAnalyzed}
                </Typography>
                <Typography variant="body2" color="text.secondary">URLs Analyzed</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>
                  {platformStats.accuracyRate}
                </Typography>
                <Typography variant="body2" color="text.secondary">Detection Accuracy</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
                  {platformStats.avgResponseTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">Avg Response</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>
                  {platformStats.botProtectionTypes}
                </Typography>
                <Typography variant="body2" color="text.secondary">Bot Types Detected</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899' }}>
                  {platformStats.countriesServed}
                </Typography>
                <Typography variant="body2" color="text.secondary">Countries</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4' }}>
                  {platformStats.uptime}
                </Typography>
                <Typography variant="body2" color="text.secondary">Uptime</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box component="section" aria-label="Features">
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Typography
            variant="h2"
            align="center"
            sx={{ mb: 2, fontWeight: 700 }}
          >
            Everything You Need
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 2, maxWidth: 700, mx: 'auto' }}
          >
            A comprehensive toolkit for web scraping analysis, SEO auditing, and URL intelligence
          </Typography>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Link
              href="/features"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '1rem',
              }}
            >
              Learn more about all features →
            </Link>
          </Box>

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
      </Box>

      {/* Key Benefits List Section */}
      <Box
        component="section"
        aria-label="Key Benefits"
        sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 8 } }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" align="center" sx={{ mb: 4, fontWeight: 700 }}>
            Why Choose URL Lens?
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                For Web Scrapers:
              </Typography>
              <Box component="ul" sx={{ pl: 2, '& li': { mb: 1.5 } }}>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Identify bot protection before writing code</Typography>
                  </Box>
                </li>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Detect rate limits and throttling mechanisms</Typography>
                  </Box>
                </li>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Understand redirect chains and final destinations</Typography>
                  </Box>
                </li>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Check robots.txt rules for crawler access</Typography>
                  </Box>
                </li>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                For SEO Professionals:
              </Typography>
              <Box component="ul" sx={{ pl: 2, '& li': { mb: 1.5 } }}>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Analyze SEO, AEO, GEO, and LLMO optimization</Typography>
                  </Box>
                </li>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Track UTM parameters through redirects</Typography>
                  </Box>
                </li>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Visualize the complete URL journey with screenshots</Typography>
                  </Box>
                </li>
                <li>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body1">Generate shareable reports for clients</Typography>
                  </Box>
                </li>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Expert Quote Section */}
      <Box
        component="section"
        aria-label="Expert Insights"
        sx={{ py: { xs: 6, md: 8 } }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 3,
              position: 'relative',
            }}
          >
            <FormatQuote sx={{ fontSize: 60, opacity: 0.3, position: 'absolute', top: 16, left: 16 }} />
            <Typography
              variant="h5"
              sx={{ fontStyle: 'italic', mb: 3, pl: { xs: 0, md: 6 }, lineHeight: 1.6 }}
            >
              Understanding a website&apos;s scrapability before building your data pipeline saves countless hours of debugging. URL Lens provides the insights you need upfront.
            </Typography>
            <Box sx={{ pl: { xs: 0, md: 6 } }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Pardeep Dhingra
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Founder & Developer, URL Lens | 10+ years in web scraping and data engineering
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* FAQ Section */}
      <FAQSection />

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

      {/* FAQ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <Footer />
    </Box>
  );
}
