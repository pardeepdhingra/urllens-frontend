// ============================================================================
// URL Lens - Features Page
// Detailed information about all features
// ============================================================================

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
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
  Analytics,
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
} from '@mui/icons-material';
import { Header } from '@/components';
import { getServerUser } from '@/lib/supabase/server';

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  category: 'core' | 'seo' | 'visual' | 'sharing';
}

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

const categoryColors = {
  core: '#2563eb',
  seo: '#7c3aed',
  visual: '#059669',
  sharing: '#d97706',
};

const categoryLabels = {
  core: 'Core Analysis',
  seo: 'SEO Intelligence',
  visual: 'Visual Analysis',
  sharing: 'Collaboration',
};

export default async function FeaturesPage() {
  const user = await getServerUser();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header user={user ? { email: user.email || '' } : null} />

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 800,
              mb: 2,
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
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              sx={{
                bgcolor: categoryColors[key as keyof typeof categoryColors],
                color: 'white',
                fontWeight: 600,
              }}
            />
          ))}
        </Box>
      </Container>

      {/* Features List */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {featureSections.map((feature) => (
            <Grid size={{ xs: 12 }} key={feature.id}>
              <Card
                id={feature.id}
                sx={{
                  borderLeft: `4px solid ${categoryColors[feature.category]}`,
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
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
                          <Typography variant="h5" fontWeight={700}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {feature.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {feature.description}
                      </Typography>
                      <Chip
                        label={categoryLabels[feature.category]}
                        size="small"
                        sx={{
                          bgcolor: `${categoryColors[feature.category]}20`,
                          color: categoryColors[feature.category],
                          fontWeight: 600,
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Key Benefits
                      </Typography>
                      <List dense disablePadding>
                        {feature.benefits.map((benefit, index) => (
                          <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle
                                sx={{
                                  fontSize: 18,
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
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Ready to Analyze?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Start using all these features today. Create your free account and analyze any URL.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <a href="/dashboard" style={{ textDecoration: 'none' }}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  Go to Dashboard
                </Box>
              </a>
            ) : (
              <>
                <a href="/signup" style={{ textDecoration: 'none' }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    Get Started Free
                  </Box>
                </a>
                <a href="/login" style={{ textDecoration: 'none' }}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'primary.main', color: 'white' },
                    }}
                  >
                    Sign In
                  </Box>
                </a>
              </>
            )}
          </Box>
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
            © {new Date().getFullYear()} URL Lens. Built for web scraping enthusiasts and SEO professionals.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
