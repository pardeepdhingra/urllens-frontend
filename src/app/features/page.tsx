// ============================================================================
// URL Lens - Features Page
// Comprehensive showcase of all features with visuals
// ============================================================================

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic';

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Speed,
  Shield,
  CameraAlt,
  Link as LinkIcon,
  Storage,
  Security,
  TrendingUp,
  Share,
  CheckCircle,
  Code,
  Visibility,
  Timeline,
  SmartToy,
  Search,
  Public,
  BatchPrediction,
} from '@mui/icons-material';
import { Header, Footer } from '@/components';
import { getServerUser } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  category: 'core' | 'seo' | 'visual' | 'sharing' | 'audit';
  image?: string;
}

// Check if URL Audit feature is enabled
const isUnderDevEnabled = process.env.NEXT_PUBLIC_UNDER_DEV === 'true';

const featureSections: FeatureSection[] = [
  {
    id: 'scrapability',
    icon: TrendingUp,
    title: 'Scrapability Analysis',
    subtitle: 'Instant URL Intelligence',
    description:
      'Get a comprehensive 0-100 scrapability score that tells you exactly how easy or difficult it will be to scrape any URL. Our algorithm analyzes multiple factors including response codes, redirect chains, content types, and protection mechanisms to give you actionable intelligence.',
    benefits: [
      'Instant 0-100 scrapability score',
      'Response time measurement',
      'Content type detection',
      'Redirect chain analysis',
      'Actionable recommendations',
    ],
    category: 'core',
    image: '/images/features/scrapability-score.svg',
  },
  {
    id: 'bot-protection',
    icon: Shield,
    title: 'Bot Protection Detection',
    subtitle: 'Know What You\'re Up Against',
    description:
      'Automatically detect and identify various bot protection mechanisms including Cloudflare, reCAPTCHA, hCaptcha, DataDome, PerimeterX, and more. Understand exactly what challenges you\'ll face before building your scraper.',
    benefits: [
      'Cloudflare detection (all versions)',
      'CAPTCHA identification (reCAPTCHA, hCaptcha)',
      'WAF detection (DataDome, PerimeterX, Akamai)',
      'JavaScript challenge detection',
      'Custom protection pattern matching',
    ],
    category: 'core',
    image: '/images/features/bot-protection.svg',
  },
  {
    id: 'redirects',
    icon: Timeline,
    title: 'Redirect Chain Analysis',
    subtitle: 'Follow Every Hop',
    description:
      'Track the complete redirect chain from your initial URL to the final destination. See every HTTP status code, intermediate URL, and understand how your requests are being routed through the web.',
    benefits: [
      'Complete redirect chain visualization',
      'HTTP status codes at each hop',
      'Protocol changes detection (HTTP → HTTPS)',
      'Domain crossing identification',
      'Redirect loop detection',
    ],
    category: 'core',
    image: '/images/features/redirect-chain.svg',
  },
  {
    id: 'visual-analysis',
    icon: CameraAlt,
    title: 'Visual Redirect Timeline',
    subtitle: 'See What Crawlers See',
    description:
      'Capture screenshots at each step of the redirect chain to visualize exactly what a crawler would encounter. Identify blocking pages, CAPTCHAs, and access denied screens instantly with our visual timeline.',
    benefits: [
      'Screenshots at each redirect hop',
      'Visual bot protection identification',
      'Blocking page detection',
      'Interactive timeline view',
      'Zoomable screenshot viewer',
    ],
    category: 'visual',
    image: '/images/features/visual-timeline.svg',
  },
  {
    id: 'seo-analysis',
    icon: Search,
    title: 'SEO Analysis',
    subtitle: 'Search Engine Optimization Score',
    description:
      'Get a comprehensive SEO score based on traditional search engine ranking factors. Analyze meta tags, heading structure, content quality, and technical SEO elements to understand how well optimized a page is for search engines like Google and Bing.',
    benefits: [
      'Meta tags analysis (title, description, keywords)',
      'Heading structure evaluation (H1-H6)',
      'Image alt text coverage',
      'Internal/external link analysis',
      'Mobile-friendliness indicators',
      'Page speed insights',
    ],
    category: 'seo',
    image: '/images/features/seo-analysis.svg',
  },
  {
    id: 'aeo-analysis',
    icon: Visibility,
    title: 'AEO Analysis',
    subtitle: 'Answer Engine Optimization Score',
    description:
      'Measure how well your content is optimized for featured snippets and direct answers. AEO focuses on structured content that can be extracted and displayed directly in search results, voice assistants, and knowledge panels.',
    benefits: [
      'Featured snippet optimization',
      'FAQ schema detection',
      'How-to content structure',
      'Question-answer format analysis',
      'Concise answer potential',
      'Voice search readiness',
    ],
    category: 'seo',
  },
  {
    id: 'geo-analysis',
    icon: Public,
    title: 'GEO Analysis',
    subtitle: 'Generative Engine Optimization Score',
    description:
      'Evaluate how well your content is optimized for AI-powered search engines like Google SGE, Bing Chat, and Perplexity. GEO focuses on content that AI systems can understand, cite, and use to generate comprehensive answers.',
    benefits: [
      'AI search engine compatibility',
      'Citation-worthy content structure',
      'Authoritative source signals',
      'Comprehensive topic coverage',
      'Structured data for AI understanding',
      'E-E-A-T signals analysis',
    ],
    category: 'seo',
  },
  {
    id: 'llmo-analysis',
    icon: SmartToy,
    title: 'LLMO Analysis',
    subtitle: 'Large Language Model Optimization Score',
    description:
      'Understand how likely your content is to be cited by Large Language Models like ChatGPT, Claude, and other AI assistants. LLMO analysis focuses on content structure, authority signals, and machine-readable formats that LLMs prefer.',
    benefits: [
      'LLM citation likelihood score',
      'Content clarity for AI parsing',
      'Author and source attribution',
      'Structured data coverage',
      'Fact-checkable claim structure',
      'Machine-readable format analysis',
    ],
    category: 'seo',
  },
  {
    id: 'utm-tracking',
    icon: LinkIcon,
    title: 'UTM & Parameter Tracking',
    subtitle: 'Marketing Attribution Intelligence',
    description:
      'Track how URL parameters change through redirect chains. Essential for marketing teams to understand if UTM parameters are preserved, modified, or stripped during redirects, ensuring accurate attribution.',
    benefits: [
      'UTM parameter preservation tracking',
      'Parameter modification detection',
      'Click ID tracking (gclid, fbclid, etc.)',
      'Custom parameter monitoring',
      'Redirect parameter analysis',
      'Marketing attribution insights',
    ],
    category: 'core',
    image: '/images/features/utm-tracking.svg',
  },
  {
    id: 'headers',
    icon: Storage,
    title: 'Headers Inspection',
    subtitle: 'Deep HTTP Analysis',
    description:
      'Examine all HTTP response headers to understand server configuration, caching policies, security headers, and more. Essential for understanding how a server communicates with clients and crawlers.',
    benefits: [
      'Complete header analysis',
      'Security header detection',
      'Caching policy inspection',
      'Server identification',
      'CORS configuration check',
      'Custom header detection',
    ],
    category: 'core',
  },
  {
    id: 'robots-txt',
    icon: Code,
    title: 'robots.txt Analysis',
    subtitle: 'Crawler Permission Check',
    description:
      'Parse and analyze the robots.txt file to understand what crawlers are allowed to access. Check specific user-agent rules, disallow patterns, crawl delays, and sitemap references.',
    benefits: [
      'User-agent specific rules',
      'Disallow pattern analysis',
      'Crawl delay detection',
      'Sitemap URL extraction',
      'Allow/Disallow rule matching',
      'Wildcard pattern interpretation',
    ],
    category: 'core',
  },
  {
    id: 'rate-limits',
    icon: Security,
    title: 'Rate Limit Detection',
    subtitle: 'Understand Scraping Constraints',
    description:
      'Identify rate limiting headers and understand the constraints you\'ll face when scraping at scale. Detect X-RateLimit headers, Retry-After values, and other throttling indicators.',
    benefits: [
      'X-RateLimit header detection',
      'Retry-After value parsing',
      'Request quota identification',
      'Throttling pattern detection',
      'Rate limit window analysis',
      'Recommended delay calculation',
    ],
    category: 'core',
  },
  {
    id: 'sharing',
    icon: Share,
    title: 'Shareable Reports',
    subtitle: 'Collaborate with Your Team',
    description:
      'Generate shareable links for any analysis to collaborate with team members, clients, or stakeholders. Share comprehensive reports without requiring recipients to create an account.',
    benefits: [
      'One-click share link generation',
      'No account required to view',
      'Complete analysis preserved',
      'Permanent shareable URLs',
      'Team collaboration ready',
      'Client reporting support',
    ],
    category: 'sharing',
  },
];

// URL Audit feature (only shown when enabled)
const auditFeature: FeatureSection = {
  id: 'url-audit',
  icon: BatchPrediction,
  title: 'Bulk URL Audit',
  subtitle: 'Analyze Hundreds of URLs at Once',
  description:
    'Audit entire websites or URL lists with our powerful batch processing engine. Upload a CSV, paste URLs, or let us discover URLs automatically from sitemaps and robots.txt. Get comprehensive scrapability analysis for every URL with recommendations for the best entry points.',
  benefits: [
    'Batch mode: Upload CSV or paste URL lists',
    'Domain mode: Auto-discover URLs from sitemap',
    'Scrapability scores for every URL',
    'Bot protection detection across all URLs',
    'Best entry point recommendations',
    'Export results to CSV or JSON',
  ],
  category: 'audit',
  image: '/images/features/url-audit.svg',
};

const categoryColors = {
  core: '#2563eb',
  seo: '#7c3aed',
  visual: '#059669',
  sharing: '#d97706',
  audit: '#8b5cf6',
};

const categoryLabels = {
  core: 'Core Analysis',
  seo: 'SEO Intelligence',
  visual: 'Visual Analysis',
  sharing: 'Collaboration',
  audit: 'Bulk Processing',
};

export default async function FeaturesPage() {
  const user = await getServerUser();

  // Add audit feature if enabled
  const allFeatures = isUnderDevEnabled
    ? [auditFeature, ...featureSections]
    : featureSections;

  // Get unique categories for the current features
  const activeCategories = [...new Set(allFeatures.map(f => f.category))];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header user={user ? { email: user.email || '' } : null} />

      {/* Hero Section */}
      <Box
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
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 800,
              mb: 3,
              textAlign: 'center',
            }}
          >
            All Features
          </Typography>
          <Typography
            variant="h5"
            sx={{
              opacity: 0.9,
              fontWeight: 400,
              textAlign: 'center',
              maxWidth: 800,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Comprehensive URL analysis, SEO auditing, and web intelligence tools
            designed for developers, marketers, and SEO professionals.
          </Typography>
        </Container>
      </Box>

      {/* Feature Categories */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {activeCategories.map((key) => (
            <Chip
              key={key}
              label={categoryLabels[key as keyof typeof categoryLabels]}
              sx={{
                bgcolor: categoryColors[key as keyof typeof categoryColors],
                color: 'white',
                fontWeight: 600,
                px: 1,
              }}
            />
          ))}
        </Box>
      </Container>

      {/* Featured Section with Images */}
      <Box sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" sx={{ mb: 2, fontWeight: 700 }}>
            Powerful Analysis Tools
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            Our most popular features with visual demonstrations
          </Typography>

          {allFeatures
            .filter((f) => f.image)
            .map((feature, index) => (
              <Box key={feature.id} sx={{ mb: 8 }}>
                <Grid
                  container
                  spacing={6}
                  alignItems="center"
                  direction={index % 2 === 0 ? 'row' : 'row-reverse'}
                >
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      sx={{
                        bgcolor: 'white',
                        borderRadius: 4,
                        p: 3,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Image
                        src={feature.image!}
                        alt={feature.title}
                        width={400}
                        height={300}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Chip
                      label={categoryLabels[feature.category]}
                      size="small"
                      sx={{
                        bgcolor: categoryColors[feature.category],
                        color: 'white',
                        fontWeight: 600,
                        mb: 2,
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: categoryColors[feature.category],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <feature.icon sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.subtitle}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {feature.benefits.slice(0, 4).map((benefit, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: categoryColors[feature.category], flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary">
                            {benefit}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
        </Container>
      </Box>

      {/* All Features List */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h2" align="center" sx={{ mb: 2, fontWeight: 700 }}>
          Complete Feature List
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Every tool you need for comprehensive URL analysis
        </Typography>

        <Grid container spacing={4}>
          {allFeatures.map((feature) => (
            <Grid size={{ xs: 12, md: 6 }} key={feature.id}>
              <Card
                id={feature.id}
                sx={{
                  height: '100%',
                  borderLeft: `4px solid ${categoryColors[feature.category]}`,
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: categoryColors[feature.category],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <feature.icon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>
                  <Chip
                    label={categoryLabels[feature.category]}
                    size="small"
                    sx={{
                      bgcolor: `${categoryColors[feature.category]}15`,
                      color: categoryColors[feature.category],
                      fontWeight: 600,
                      mb: 2,
                    }}
                  />
                  <List dense disablePadding>
                    {feature.benefits.map((benefit, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle
                            sx={{
                              fontSize: 16,
                              color: categoryColors[feature.category],
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={benefit}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: '#0f172a', color: 'white', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Ready to Analyze?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Start using all these features today. Create your free account and analyze any URL.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    bgcolor: 'white',
                    color: '#0f172a',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                >
                  Go to Dashboard
                </Box>
              </Link>
            ) : (
              <>
                <Link href="/signup" style={{ textDecoration: 'none' }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      bgcolor: '#3b82f6',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#2563eb' },
                    }}
                  >
                    Get Started Free
                  </Box>
                </Link>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      border: '2px solid white',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                  >
                    Sign In
                  </Box>
                </Link>
              </>
            )}
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
