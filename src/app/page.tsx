// ============================================================================
// URL Lens - Landing Page
// Enhanced with feature images and comprehensive feature showcase
// ============================================================================

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic';

import { Box, Container, Typography, Card, CardContent, Paper, Chip } from '@mui/material';
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
  BatchPrediction,
  SmartToy,
  Public,
  Visibility,
  Code,
} from '@mui/icons-material';
import { Header, FAQSection, Footer } from '@/components';
import { faqData } from '@/lib/faqData';
import { getServerUser } from '@/lib/supabase/server';
import { LandingButtons } from '@/components/LandingButtons';
import Link from 'next/link';
import Image from 'next/image';

// Platform statistics - updated monthly
const platformStats = {
  urlsAnalyzed: '10,000+',
  accuracyRate: '98%',
  avgResponseTime: '2.3s',
  botProtectionTypes: 15,
  countriesServed: 45,
  uptime: '99.9%',
};

// Core features with images
const coreFeatures = [
  {
    icon: TrendingUp,
    title: 'Scrapability Score',
    description: 'Get a comprehensive 0-100 score indicating how easy a URL is to scrape. Analyze response codes, redirects, and protections in seconds.',
    image: '/images/features/scrapability-score.svg',
    color: '#22c55e',
  },
  {
    icon: Shield,
    title: 'Bot Protection Detection',
    description: 'Identify Cloudflare, reCAPTCHA, DataDome, PerimeterX, Akamai, and 15+ other anti-bot measures automatically.',
    image: '/images/features/bot-protection.svg',
    color: '#3b82f6',
  },
  {
    icon: CameraAlt,
    title: 'Visual Redirect Timeline',
    description: 'See screenshots at each redirect hop to visualize the complete journey. Identify blocking pages and CAPTCHAs instantly.',
    image: '/images/features/visual-timeline.svg',
    color: '#8b5cf6',
  },
];

// SEO features
const seoFeatures = [
  {
    icon: Search,
    title: 'SEO Analysis',
    description: 'Traditional search engine optimization score based on meta tags, headings, content quality, and technical SEO.',
    color: '#3b82f6',
  },
  {
    icon: Visibility,
    title: 'AEO Analysis',
    description: 'Answer Engine Optimization for featured snippets, FAQ schemas, and voice search readiness.',
    color: '#8b5cf6',
  },
  {
    icon: Public,
    title: 'GEO Analysis',
    description: 'Generative Engine Optimization for AI search engines like Google SGE and Perplexity.',
    color: '#ec4899',
  },
  {
    icon: SmartToy,
    title: 'LLMO Analysis',
    description: 'Large Language Model Optimization for citation likelihood in ChatGPT, Claude, and other AI assistants.',
    color: '#06b6d4',
  },
];

// Additional features
const additionalFeatures = [
  {
    icon: Speed,
    title: 'Fast Analysis',
    description: 'Get instant insights about any URL in seconds, including response times and redirect chains.',
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
    icon: Code,
    title: 'robots.txt Analysis',
    description: 'Parse crawler permission rules, disallow patterns, and sitemap references.',
  },
  {
    icon: Share,
    title: 'Shareable Reports',
    description: 'Generate shareable links to collaborate with your team without requiring accounts.',
  },
];

// Check if URL Audit feature is enabled
const isUnderDevEnabled = process.env.NEXT_PUBLIC_UNDER_DEV === 'true';

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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="The Complete URL Analysis Platform"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 600,
                  mb: 3,
                  backdropFilter: 'blur(4px)',
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  mb: 3,
                  lineHeight: 1.2,
                }}
              >
                Analyze URLs
                <br />
                <Box component="span" sx={{ color: '#22c55e' }}>Like Never Before</Box>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 400,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                }}
              >
                Scrapability scores, bot protection detection, SEO/AEO/GEO/LLMO analysis,
                visual redirect timelines, and shareable reports — all in one platform.
              </Typography>
              <LandingButtons isLoggedIn={!!user} />

              {/* Trust indicators */}
              <Box sx={{ display: 'flex', gap: 3, mt: 4, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Free to start</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>No credit card</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Instant results</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  position: 'relative',
                  '& img': {
                    width: '100%',
                    height: 'auto',
                    filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))',
                  },
                }}
              >
                <Image
                  src="/images/features/hero-analysis.svg"
                  alt="URL Analysis Dashboard showing scrapability score and analysis results"
                  width={500}
                  height={400}
                  priority
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box
        component="section"
        aria-label="Platform Statistics"
        sx={{ bgcolor: 'white', py: { xs: 6, md: 8 }, borderBottom: '1px solid #e2e8f0' }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: 'primary.main' }}>
                  {platformStats.urlsAnalyzed}
                </Typography>
                <Typography variant="body2" color="text.secondary">URLs Analyzed</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>
                  {platformStats.accuracyRate}
                </Typography>
                <Typography variant="body2" color="text.secondary">Detection Accuracy</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
                  {platformStats.avgResponseTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">Avg Response</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>
                  {platformStats.botProtectionTypes}
                </Typography>
                <Typography variant="body2" color="text.secondary">Bot Types Detected</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899' }}>
                  {platformStats.countriesServed}
                </Typography>
                <Typography variant="body2" color="text.secondary">Countries</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4' }}>
                  {platformStats.uptime}
                </Typography>
                <Typography variant="body2" color="text.secondary">Uptime</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Core Features with Images */}
      <Box component="section" aria-label="Core Features" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="Core Features" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
              Powerful Analysis Tools
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Everything you need to understand any URL before building your scraper or optimizing your SEO.
            </Typography>
          </Box>

          {coreFeatures.map((feature, index) => (
            <Box key={feature.title} sx={{ mb: 10 }}>
              <Grid
                container
                spacing={6}
                alignItems="center"
                direction={index % 2 === 0 ? 'row' : 'row-reverse'}
              >
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: '#f8fafc',
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={400}
                      height={300}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      bgcolor: feature.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    <feature.icon sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.75rem', md: '2rem' } }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                  <Link href="/features" style={{ textDecoration: 'none' }}>
                    <Typography
                      component="span"
                      sx={{
                        color: feature.color,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Learn more →
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Container>
      </Box>

      {/* URL Audit Feature (if enabled) */}
      {isUnderDevEnabled && (
        <Box
          component="section"
          aria-label="URL Audit"
          sx={{
            py: { xs: 8, md: 12 },
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            color: 'white',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Chip
                  label="New Feature"
                  sx={{ bgcolor: '#22c55e', color: 'white', fontWeight: 600, mb: 2 }}
                />
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
                  Bulk URL Audit
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, fontSize: '1.1rem', lineHeight: 1.7 }}>
                  Audit hundreds of URLs at once with our batch processing engine.
                  Upload a CSV, paste a list, or discover URLs from a domain automatically.
                  Get scrapability scores, bot protection detection, and recommendations for every URL.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle sx={{ color: '#22c55e' }} />
                    <Typography>Batch mode: Upload CSV or paste URLs</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle sx={{ color: '#22c55e' }} />
                    <Typography>Domain mode: Auto-discover URLs from sitemap</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle sx={{ color: '#22c55e' }} />
                    <Typography>Export results to CSV or JSON</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle sx={{ color: '#22c55e' }} />
                    <Typography>Find best entry points for scraping</Typography>
                  </Box>
                </Box>
                <Link href="/audit" style={{ textDecoration: 'none' }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      bgcolor: 'white',
                      color: '#2563eb',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#f1f5f9' },
                    }}
                  >
                    Try URL Audit →
                  </Box>
                </Link>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    p: 2,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Image
                    src="/images/features/url-audit.svg"
                    alt="Bulk URL Audit showing batch analysis results"
                    width={400}
                    height={300}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      {/* SEO Analysis Section */}
      <Box
        component="section"
        aria-label="SEO Analysis"
        sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: 4,
                  p: 2,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}
              >
                <Image
                  src="/images/features/seo-analysis.svg"
                  alt="SEO Analysis showing all four optimization scores"
                  width={400}
                  height={300}
                  style={{ width: '100%', height: 'auto' }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip label="SEO Intelligence" sx={{ bgcolor: '#8b5cf6', color: 'white', mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
                Four-Dimensional SEO Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
                Go beyond traditional SEO with our comprehensive analysis covering all aspects
                of modern search optimization.
              </Typography>
              <Grid container spacing={2}>
                {seoFeatures.map((feature) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={feature.title}>
                    <Card
                      sx={{
                        height: '100%',
                        borderLeft: `4px solid ${feature.color}`,
                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <feature.icon sx={{ color: feature.color }} />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {feature.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* UTM & Redirect Tracking */}
      <Box component="section" aria-label="UTM Tracking" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip label="Marketing Attribution" sx={{ bgcolor: '#ec4899', color: 'white', mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
                Track Parameters Through Redirects
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.7 }}>
                Never lose track of your marketing attribution again. See exactly how UTM parameters,
                click IDs (gclid, fbclid), and custom parameters flow through redirect chains.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                <Chip label="utm_source" sx={{ bgcolor: '#3b82f6', color: 'white' }} />
                <Chip label="utm_medium" sx={{ bgcolor: '#8b5cf6', color: 'white' }} />
                <Chip label="utm_campaign" sx={{ bgcolor: '#ec4899', color: 'white' }} />
                <Chip label="gclid" sx={{ bgcolor: '#06b6d4', color: 'white' }} />
                <Chip label="fbclid" sx={{ bgcolor: '#f59e0b', color: 'white' }} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: '#f8fafc',
                  borderRadius: 4,
                  p: 2,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Image
                  src="/images/features/utm-tracking.svg"
                  alt="UTM Parameter tracking through redirects"
                  width={400}
                  height={300}
                  style={{ width: '100%', height: 'auto' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Additional Features Grid */}
      <Box
        component="section"
        aria-label="More Features"
        sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
              And Much More
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              A comprehensive toolkit for web scraping analysis, SEO auditing, and URL intelligence
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {additionalFeatures.map((feature, index) => (
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
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Link href="/features" style={{ textDecoration: 'none' }}>
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View all features →
              </Box>
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Key Benefits List Section */}
      <Box
        component="section"
        aria-label="Key Benefits"
        sx={{ py: { xs: 6, md: 8 } }}
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
                {isUnderDevEnabled && (
                  <li>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckCircle sx={{ color: '#22c55e', fontSize: 20, mt: 0.3 }} />
                      <Typography variant="body1">Bulk audit hundreds of URLs at once</Typography>
                    </Box>
                  </li>
                )}
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
                John Doe
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
      <Box sx={{ bgcolor: '#0f172a', color: 'white', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Ready to Start Analyzing?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Create your free account and start analyzing URLs today.
            No credit card required.
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
