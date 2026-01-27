'use client';

// ============================================================================
// URL Lens - Shared Result Display Component
// ============================================================================

import { useState } from 'react';
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
  Paper,
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
  Storage,
} from '@mui/icons-material';
import type { URLAnalysis, BotProtection, Redirect } from '@/types';
import { getScoreColor, getScoreLabel } from '@/lib/scoringEngine';
import { analyzeHeaders, groupHeadersByCategory, type HeaderInfo } from '@/lib/headersInspector';

interface SharedResultDisplayProps {
  analysis: URLAnalysis;
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
          width: 140,
          height: 140,
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
            border: '10px solid #e2e8f0',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '10px solid transparent',
            borderTopColor: colorMap[color],
            borderRightColor: score > 25 ? colorMap[color] : 'transparent',
            borderBottomColor: score > 50 ? colorMap[color] : 'transparent',
            borderLeftColor: score > 75 ? colorMap[color] : 'transparent',
            transform: 'rotate(-45deg)',
          }}
        />
        <Typography variant="h2" fontWeight={700} color={colorMap[color]}>
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

  const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    security: { label: 'Security Headers', icon: <Security fontSize="small" /> },
    cors: { label: 'CORS Headers', icon: <Storage fontSize="small" /> },
    caching: { label: 'Caching Headers', icon: <Timer fontSize="small" /> },
    content: { label: 'Content Headers', icon: <Code fontSize="small" /> },
    server: { label: 'Server Headers', icon: <Speed fontSize="small" /> },
    custom: { label: 'Custom Headers', icon: <Shield fontSize="small" /> },
    other: { label: 'Other Headers', icon: <Storage fontSize="small" /> },
  };

  const impactColors: Record<HeaderInfo['impact'], string> = {
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#6b7280',
    info: '#3b82f6',
  };

  return (
    <Box>
      {Object.entries(grouped).map(([category, categoryHeaders]) => {
        if (categoryHeaders.length === 0) return null;

        const { label, icon } = categoryLabels[category] || { label: category, icon: null };

        return (
          <Accordion key={category} defaultExpanded={category === 'security'}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography fontWeight={600}>{label}</Typography>
                <Chip label={categoryHeaders.length} size="small" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="25%">Header</TableCell>
                      <TableCell width="35%">Value</TableCell>
                      <TableCell>Analysis</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryHeaders.map((header) => (
                      <TableRow key={header.name}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            fontWeight={500}
                          >
                            {header.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={header.value}>
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              sx={{
                                maxWidth: 250,
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
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {header.description}
                            </Typography>
                            {header.recommendation && (
                              <Typography
                                variant="body2"
                                sx={{ color: impactColors[header.impact], mt: 0.5 }}
                              >
                                → {header.recommendation}
                              </Typography>
                            )}
                          </Box>
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
    </Box>
  );
}

function RobotsTxtSection({ robotsTxt }: { robotsTxt: URLAnalysis['robots_txt'] }) {
  if (!robotsTxt) {
    return (
      <Alert severity="info" icon={<SmartToy />}>
        robots.txt analysis not available.
      </Alert>
    );
  }

  return (
    <Box>
      <Alert
        severity={robotsTxt.exists ? (robotsTxt.allowed ? 'success' : 'warning') : 'info'}
        icon={<SmartToy />}
        sx={{ mb: 2 }}
      >
        {!robotsTxt.exists
          ? 'No robots.txt found - crawling is allowed by default.'
          : robotsTxt.allowed
          ? 'This URL is ALLOWED for crawling according to robots.txt.'
          : 'This URL is DISALLOWED for crawling according to robots.txt.'}
      </Alert>

      {robotsTxt.crawl_delay && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Crawl delay: {robotsTxt.crawl_delay} seconds between requests.
        </Alert>
      )}

      {robotsTxt.sitemaps && robotsTxt.sitemaps.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sitemaps Found:
          </Typography>
          <Stack spacing={0.5}>
            {robotsTxt.sitemaps.map((sitemap, i) => (
              <Typography
                key={i}
                variant="body2"
                fontFamily="monospace"
                sx={{ fontSize: '0.8rem' }}
              >
                • {sitemap}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {robotsTxt.rules && robotsTxt.rules.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={500}>
              Rules ({robotsTxt.rules.length} user-agent groups)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {robotsTxt.rules.map((rule, i) => (
              <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontFamily="monospace">
                  User-agent: {rule.user_agent}
                </Typography>
                {rule.allow.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="success.main">
                      Allow:
                    </Typography>
                    {rule.allow.map((path, j) => (
                      <Typography
                        key={j}
                        variant="body2"
                        fontFamily="monospace"
                        sx={{ ml: 2 }}
                      >
                        {path}
                      </Typography>
                    ))}
                  </Box>
                )}
                {rule.disallow.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="error.main">
                      Disallow:
                    </Typography>
                    {rule.disallow.map((path, j) => (
                      <Typography
                        key={j}
                        variant="body2"
                        fontFamily="monospace"
                        sx={{ ml: 2 }}
                      >
                        {path}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

function RateLimitSection({ rateLimitInfo }: { rateLimitInfo: URLAnalysis['rate_limit_info'] }) {
  if (!rateLimitInfo) {
    return (
      <Alert severity="info" icon={<Timer />}>
        Rate limit detection not available.
      </Alert>
    );
  }

  return (
    <Box>
      <Alert
        severity={rateLimitInfo.detected ? 'warning' : 'success'}
        icon={<Timer />}
        sx={{ mb: 2 }}
      >
        {rateLimitInfo.detected
          ? 'Rate limiting DETECTED on this URL.'
          : `No rate limiting detected after ${rateLimitInfo.requests_made} test requests.`}
      </Alert>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Test Requests Made:
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {rateLimitInfo.requests_made}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Successful Requests:
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {rateLimitInfo.requests_succeeded} / {rateLimitInfo.requests_made}
          </Typography>
        </Box>

        {rateLimitInfo.estimated_limit && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Limit:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {rateLimitInfo.estimated_limit} requests
            </Typography>
          </Box>
        )}

        {rateLimitInfo.time_window_seconds && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Time Window:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {rateLimitInfo.time_window_seconds} seconds
            </Typography>
          </Box>
        )}

        {rateLimitInfo.headers_found && rateLimitInfo.headers_found.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rate Limit Headers Found:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {rateLimitInfo.headers_found.map((header) => (
                <Chip
                  key={header}
                  label={header}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

export function SharedResultDisplay({ analysis }: SharedResultDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');

  return (
    <Stack spacing={3}>
      {/* Main Score Card */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
            }}
          >
            {/* Score Gauge */}
            <Box sx={{ flex: '0 0 auto' }}>
              <ScoreGauge score={analysis.score} />
            </Box>

            {/* Details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* URL Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Analyzed URL
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    backgroundColor: '#f8fafc',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {analysis.url}
                </Typography>
                {analysis.url !== analysis.final_url && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Final URL: {analysis.final_url}
                  </Typography>
                )}
              </Box>

              {/* Recommendation */}
              <Alert
                severity={getScoreColor(analysis.score) as 'success' | 'warning' | 'error'}
                sx={{ mb: 2 }}
                icon={
                  analysis.score >= 70 ? (
                    <CheckCircle />
                  ) : analysis.score >= 40 ? (
                    <Warning />
                  ) : (
                    <ErrorIcon />
                  )
                }
              >
                {analysis.recommendation}
              </Alert>

              <Divider sx={{ my: 2 }} />

              {/* Quick Stats */}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip
                  icon={<Speed />}
                  label={`Status: ${analysis.status_code || 'N/A'}`}
                  color={
                    analysis.status_code && analysis.status_code < 400
                      ? 'success'
                      : 'error'
                  }
                  variant="outlined"
                />
                <Chip
                  icon={<Timer />}
                  label={`${analysis.response_time_ms || 0}ms`}
                  variant="outlined"
                />
                <Chip
                  icon={<Code />}
                  label={analysis.js_required ? 'JS Required' : 'No JS'}
                  color={analysis.js_required ? 'warning' : 'success'}
                  variant="outlined"
                />
                {analysis.bot_protections && analysis.bot_protections.length > 0 && (
                  <Chip
                    icon={<Shield />}
                    label={`${analysis.bot_protections.length} Protection(s)`}
                    color="error"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Headers Inspector */}
      {analysis.headers && Object.keys(analysis.headers).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security /> Headers Inspector
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Detailed analysis of HTTP response headers with security insights.
            </Typography>
            <HeadersSection headers={analysis.headers} />
          </CardContent>
        </Card>
      )}

      {/* robots.txt Analysis */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy /> robots.txt Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Check if this URL allows crawling and view sitemap information.
          </Typography>
          <RobotsTxtSection robotsTxt={analysis.robots_txt} />
        </CardContent>
      </Card>

      {/* Rate Limit Detection */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timer /> Rate Limit Detection
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Results from multiple test requests to detect rate limiting.
          </Typography>
          <RateLimitSection rateLimitInfo={analysis.rate_limit_info} />
        </CardContent>
      </Card>

      {/* Bot Protections */}
      {analysis.bot_protections && analysis.bot_protections.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield /> Bot Protections Detected
            </Typography>
            <Stack spacing={1}>
              {analysis.bot_protections.map((protection: BotProtection, i: number) => (
                <Alert
                  key={i}
                  severity="warning"
                  sx={{ textTransform: 'capitalize' }}
                >
                  <strong>{protection.type}</strong>
                  {protection.details && ` - ${protection.details}`}
                  <Chip
                    label={protection.confidence}
                    size="small"
                    sx={{ ml: 1 }}
                    color={
                      protection.confidence === 'high'
                        ? 'error'
                        : protection.confidence === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Redirects */}
      {analysis.redirects && analysis.redirects.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Redirect Chain ({analysis.redirects.length})
            </Typography>
            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
              {analysis.redirects.map((redirect: Redirect, i: number) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip size="small" label={redirect.status} variant="outlined" />
                  <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem' }}>
                    {redirect.from} → {redirect.to}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
