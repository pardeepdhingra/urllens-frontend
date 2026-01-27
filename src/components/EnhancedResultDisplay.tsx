'use client';

// ============================================================================
// URL Lens - Enhanced Result Display with New Features
// ============================================================================

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Divider,
  Stack,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Snackbar,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  Security,
  Speed,
  Code,
  Shield,
  SmartToy,
  Timer,
  Share,
  ContentCopy,
  CallSplit,
  CameraAlt,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { AnalysisResult, BotProtection, Redirect, RobotsTxtResult, RateLimitDetection, VisualAnalysisResult, UTMAnalysisResult, SEOAnalysisResult } from '@/types';
import { getScoreColor, getScoreLabel } from '@/lib/scoringEngine';
import { analyzeHeaders, groupHeadersByCategory, type HeaderInfo } from '@/lib/headersInspector';
import { RedirectTimeline } from './RedirectTimeline';
import { UTMTrackingPanel } from './UTMTrackingPanel';
import SEOAnalysisPanel from './SEOAnalysisPanel';

interface EnhancedResultDisplayProps {
  result: AnalysisResult | null;
  analysisId?: string;
  loading: boolean;
  error?: string | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
      {value === index && children}
    </Box>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const colorMap = {
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '8px solid #e2e8f0',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '8px solid transparent',
            borderTopColor: colorMap[color],
            borderRightColor: score > 25 ? colorMap[color] : 'transparent',
            borderBottomColor: score > 50 ? colorMap[color] : 'transparent',
            borderLeftColor: score > 75 ? colorMap[color] : 'transparent',
            transform: 'rotate(-45deg)',
          }}
        />
        <Typography variant="h3" fontWeight={700} color={colorMap[color]}>
          {score}
        </Typography>
      </Box>
      <Chip label={label} color={color} sx={{ mt: 2, fontWeight: 600 }} />
    </Box>
  );
}

function HeadersSection({ headers }: { headers: Record<string, string> }) {
  const analyzedHeaders = analyzeHeaders(headers);
  const grouped = groupHeadersByCategory(analyzedHeaders);

  const categoryLabels: Record<string, { label: string; color: string }> = {
    security: { label: 'Security', color: '#dc2626' },
    cors: { label: 'CORS', color: '#7c3aed' },
    caching: { label: 'Caching', color: '#2563eb' },
    content: { label: 'Content', color: '#059669' },
    server: { label: 'Server', color: '#d97706' },
    custom: { label: 'Custom', color: '#6b7280' },
    other: { label: 'Other', color: '#9ca3af' },
  };

  const impactColors: Record<HeaderInfo['impact'], string> = {
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#6b7280',
    info: '#3b82f6',
  };

  return (
    <Stack spacing={1}>
      {Object.entries(grouped).map(([category, categoryHeaders]) => {
        if (categoryHeaders.length === 0) return null;

        const { label, color } = categoryLabels[category] || { label: category, color: '#6b7280' };

        return (
          <Accordion key={category} defaultExpanded={category === 'security'}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                  }}
                />
                <Typography fontWeight={500}>{label}</Typography>
                <Chip label={categoryHeaders.length} size="small" sx={{ height: 20 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '25%' }}>Header</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '30%' }}>Value</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Analysis</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryHeaders.map((header) => (
                      <TableRow key={header.name} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                            {header.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={header.value}>
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              fontSize="0.75rem"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {header.value}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                            {header.description}
                          </Typography>
                          {header.recommendation && (
                            <Typography
                              variant="body2"
                              fontSize="0.8rem"
                              sx={{ color: impactColors[header.impact], mt: 0.5 }}
                            >
                              → {header.recommendation}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}

function RobotsTxtSection({ robotsTxt }: { robotsTxt?: RobotsTxtResult }) {
  if (!robotsTxt) {
    return (
      <Alert severity="info" icon={<SmartToy />}>
        robots.txt analysis not available for this URL.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert
        severity={robotsTxt.exists ? (robotsTxt.allowed ? 'success' : 'warning') : 'info'}
        icon={<SmartToy />}
      >
        {!robotsTxt.exists
          ? 'No robots.txt found - crawling is allowed by default.'
          : robotsTxt.allowed
          ? 'This URL is ALLOWED for crawling.'
          : 'This URL is DISALLOWED for crawling.'}
      </Alert>

      {robotsTxt.crawl_delay && (
        <Alert severity="info">
          Crawl delay recommended: <strong>{robotsTxt.crawl_delay} seconds</strong> between requests.
        </Alert>
      )}

      {robotsTxt.sitemaps && robotsTxt.sitemaps.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Sitemaps ({robotsTxt.sitemaps.length}):
          </Typography>
          <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
            {robotsTxt.sitemaps.map((sitemap, i) => (
              <Typography
                key={i}
                variant="body2"
                fontFamily="monospace"
                fontSize="0.8rem"
                sx={{ mb: 0.5 }}
              >
                {sitemap}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {robotsTxt.rules && robotsTxt.rules.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Rules ({robotsTxt.rules.length} user-agent groups):
          </Typography>
          <Stack spacing={1}>
            {robotsTxt.rules.slice(0, 3).map((rule, i) => (
              <Box key={i} sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
                <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                  User-agent: {rule.user_agent}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Allow: {rule.allow.length}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Disallow: {rule.disallow.length}
                  </Typography>
                </Stack>
              </Box>
            ))}
            {robotsTxt.rules.length > 3 && (
              <Typography variant="body2" color="text.secondary">
                +{robotsTxt.rules.length - 3} more user-agent groups
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function RateLimitSection({ rateLimitInfo }: { rateLimitInfo?: RateLimitDetection }) {
  if (!rateLimitInfo) {
    return (
      <Alert severity="info" icon={<Timer />}>
        Rate limit detection not available.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity={rateLimitInfo.detected ? 'warning' : 'success'} icon={<Timer />}>
        {rateLimitInfo.detected
          ? 'Rate limiting DETECTED on this URL.'
          : `No rate limiting detected (${rateLimitInfo.requests_made} test requests).`}
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Requests Made
          </Typography>
          <Typography variant="h6">{rateLimitInfo.requests_made}</Typography>
        </Box>
        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Successful
          </Typography>
          <Typography variant="h6" color={rateLimitInfo.requests_succeeded === rateLimitInfo.requests_made ? 'success.main' : 'warning.main'}>
            {rateLimitInfo.requests_succeeded}
          </Typography>
        </Box>
        {rateLimitInfo.estimated_limit && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Limit
            </Typography>
            <Typography variant="h6">{rateLimitInfo.estimated_limit}</Typography>
          </Box>
        )}
        {rateLimitInfo.time_window_seconds && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Reset Window
            </Typography>
            <Typography variant="h6">{rateLimitInfo.time_window_seconds}s</Typography>
          </Box>
        )}
      </Box>

      {rateLimitInfo.headers_found && rateLimitInfo.headers_found.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Rate Limit Headers Found:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {rateLimitInfo.headers_found.map((header) => (
              <Chip
                key={header}
                label={header}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export function EnhancedResultDisplay({
  result,
  analysisId,
  loading,
  error,
}: EnhancedResultDisplayProps) {
  const [tabValue, setTabValue] = useState(0);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Calculate dynamic tab indices based on what tabs are available
  const hasProtections = result?.bot_protections && result.bot_protections.length > 0;
  const enhancedResultForTabs = result as AnalysisResult & {
    visualAnalysis?: VisualAnalysisResult;
    utmAnalysis?: UTMAnalysisResult;
    seoAnalysis?: SEOAnalysisResult;
  };
  const hasVisualAnalysis = !!enhancedResultForTabs?.visualAnalysis;
  const hasUtmAnalysis = !!enhancedResultForTabs?.utmAnalysis;
  const hasSeoAnalysis = !!enhancedResultForTabs?.seoAnalysis;

  // Tab indices: Headers=0, robots.txt=1, Rate Limits=2, UTM=3, SEO=4 (if exists), Protections=5 (if exists), Visual Analysis=6
  // UTM tracking is always shown (index 3)
  const utmTabIndex = 3;
  let nextIndex = 4;
  const seoAnalysisTabIndex = hasSeoAnalysis ? nextIndex++ : -1;
  const protectionsTabIndex = hasProtections ? nextIndex++ : -1;
  const visualAnalysisTabIndex = hasVisualAnalysis ? nextIndex++ : -1;

  // Get total number of tabs (Headers, robots.txt, Rate Limits, UTM + optional ones)
  const totalTabs = 4 + (hasSeoAnalysis ? 1 : 0) + (hasProtections ? 1 : 0) + (hasVisualAnalysis ? 1 : 0);

  // Handle tab change - ensure value is within bounds
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue >= 0 && newValue < totalTabs) {
      setTabValue(newValue);
    }
  };

  // Reset tab to 0 when result changes to avoid stale tab index
  const resultUrl = result?.url;
  const [prevResultUrl, setPrevResultUrl] = useState<string | undefined>(undefined);
  if (resultUrl !== prevResultUrl) {
    setPrevResultUrl(resultUrl);
    if (tabValue >= totalTabs && totalTabs > 0) {
      setTabValue(0);
    }
  }

  const handleShare = async () => {
    if (!analysisId) return;

    setShareLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId }),
      });

      const data = await response.json();

      if (data.success && data.share_url) {
        setShareUrl(data.share_url);
        await navigator.clipboard.writeText(data.share_url);
        setSnackbarMessage('Share link copied to clipboard!');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Failed to create share link');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage('Failed to create share link');
      setSnackbarOpen(true);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setSnackbarMessage('Link copied!');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
              <Skeleton variant="circular" width={120} height={120} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" icon={<ErrorIcon />}>
        {error}
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  // Cast result to include new fields
  const enhancedResult = result as AnalysisResult & {
    robotsTxt?: RobotsTxtResult;
    rateLimitInfo?: RateLimitDetection;
    visualAnalysis?: VisualAnalysisResult;
    utmAnalysis?: UTMAnalysisResult;
  };

  return (
    <>
      <Card>
        <CardContent>
          {/* Header with Share Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6">Analysis Result</Typography>
            {analysisId && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {shareUrl && (
                  <Tooltip title="Copy share link">
                    <IconButton size="small" onClick={handleCopyUrl}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={handleShare}
                  disabled={shareLoading}
                >
                  {shareLoading ? 'Creating...' : shareUrl ? 'Shared' : 'Share'}
                </Button>
              </Box>
            )}
          </Box>

          {/* Main Content */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Score Gauge */}
            <Box sx={{ flex: '0 0 auto' }}>
              <ScoreGauge score={result.score} />
            </Box>

            {/* Details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* URL Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Analyzed URL
                </Typography>
                <Typography
                  sx={{
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    bgcolor: '#f8fafc',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {result.url}
                </Typography>
              </Box>

              {/* Recommendation */}
              <Alert
                severity={getScoreColor(result.score) as 'success' | 'warning' | 'error'}
                sx={{ mb: 2 }}
                icon={
                  result.score >= 70 ? (
                    <CheckCircle />
                  ) : result.score >= 40 ? (
                    <Warning />
                  ) : (
                    <ErrorIcon />
                  )
                }
              >
                {result.recommendation}
              </Alert>

              {/* Quick Stats */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<Speed />}
                  label={`${result.status || 'N/A'}`}
                  size="small"
                  color={result.status >= 200 && result.status < 400 ? 'success' : 'error'}
                  variant="outlined"
                />
                <Chip
                  icon={<Timer />}
                  label={`${result.response_time_ms || 0}ms`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<CallSplit />}
                  label={`${result.redirects?.length || 0} redirects`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Code />}
                  label={result.js_hints ? 'JS Required' : 'No JS'}
                  size="small"
                  color={result.js_hints ? 'warning' : 'success'}
                  variant="outlined"
                />
                {result.bot_protections && result.bot_protections.length > 0 && (
                  <Chip
                    icon={<Shield />}
                    label={`${result.bot_protections.length} protection(s)`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Tabs for detailed sections */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue < totalTabs ? tabValue : 0}
              onChange={handleTabChange}
              variant="scrollable"
            >
              <Tab icon={<Security />} label="Headers" iconPosition="start" />
              <Tab icon={<SmartToy />} label="robots.txt" iconPosition="start" />
              <Tab icon={<Timer />} label="Rate Limits" iconPosition="start" />
              <Tab icon={<LinkIcon />} label="UTM Tracking" iconPosition="start" />
              {hasSeoAnalysis && (
                <Tab icon={<Speed />} label="SEO Analysis" iconPosition="start" />
              )}
              {hasProtections && (
                <Tab icon={<Shield />} label="Protections" iconPosition="start" />
              )}
              {hasVisualAnalysis && (
                <Tab icon={<CameraAlt />} label="Visual Analysis" iconPosition="start" />
              )}
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {result.headers && Object.keys(result.headers).length > 0 ? (
              <HeadersSection headers={result.headers} />
            ) : (
              <Alert severity="info">No headers captured for this analysis.</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <RobotsTxtSection robotsTxt={enhancedResult.robotsTxt} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <RateLimitSection rateLimitInfo={enhancedResult.rateLimitInfo} />
          </TabPanel>

          <TabPanel value={tabValue} index={utmTabIndex}>
            <UTMTrackingPanel utmAnalysis={enhancedResult.utmAnalysis} />
          </TabPanel>

          {hasSeoAnalysis && (
            <TabPanel value={tabValue} index={seoAnalysisTabIndex}>
              <SEOAnalysisPanel analysis={enhancedResultForTabs.seoAnalysis!} />
            </TabPanel>
          )}

          {hasProtections && (
            <TabPanel value={tabValue} index={protectionsTabIndex}>
              <Stack spacing={1}>
                {result.bot_protections.map((protection: BotProtection, i: number) => (
                  <Alert key={i} severity="warning">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <strong style={{ textTransform: 'capitalize' }}>{protection.type}</strong>
                      <Chip
                        label={protection.confidence}
                        size="small"
                        color={
                          protection.confidence === 'high'
                            ? 'error'
                            : protection.confidence === 'medium'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </Box>
                    {protection.details && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {protection.details}
                      </Typography>
                    )}
                  </Alert>
                ))}
              </Stack>
            </TabPanel>
          )}

          {hasVisualAnalysis && (
            <TabPanel value={tabValue} index={visualAnalysisTabIndex}>
              <RedirectTimeline visualAnalysis={enhancedResult.visualAnalysis} />
            </TabPanel>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
}
