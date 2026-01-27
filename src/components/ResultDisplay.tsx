'use client';

// ============================================================================
// URL Lens - Result Display Component
// ============================================================================

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  Alert,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  CallSplit,
  Code,
  Shield,
  Speed,
  Info,
} from '@mui/icons-material';
import type { ResultDisplayProps, BotProtection, Redirect } from '@/types';
import { getScoreColor, getScoreLabel } from '@/lib/scoringEngine';

// Define the expected result structure
interface DisplayResult {
  url: string;
  final_url: string;
  status: number;
  redirects: Redirect[];
  js_hints: boolean;
  bot_protections: BotProtection[];
  score: number;
  recommendation: string;
}

interface ScoreGaugeProps {
  score: number;
}

function ScoreGauge({ score }: ScoreGaugeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const colorMap = {
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 3,
      }}
    >
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
            transition: 'all 0.5s ease-out',
          }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={700} color={colorMap[color]}>
            {score}
          </Typography>
        </Box>
      </Box>
      <Chip
        label={label}
        color={color}
        sx={{ mt: 2, fontWeight: 600 }}
      />
    </Box>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
}

function InfoRow({ icon, label, value, tooltip }: InfoRowProps) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <Info sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
          </Tooltip>
        )}
      </Box>
      <Box component="span" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
        {value}
      </Box>
    </Box>
  );

  return content;
}

export default function ResultDisplay({
  result,
  loading,
  error,
}: ResultDisplayProps) {
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

  // Cast to DisplayResult with the expected properties
  const analysisResult = result as unknown as DisplayResult;

  return (
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
                {result.url}
              </Typography>
              {result.url !== result.final_url && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Final URL: {result.final_url}
                </Typography>
              )}
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

            <Divider sx={{ my: 2 }} />

            {/* Stats */}
            <Stack spacing={0.5}>
              <InfoRow
                icon={<Speed sx={{ fontSize: 18, color: 'primary.main' }} />}
                label="Status Code"
                value={
                  <Chip
                    size="small"
                    label={analysisResult.status || 'N/A'}
                    color={
                      (analysisResult.status || 0) >= 200 && (analysisResult.status || 0) < 300
                        ? 'success'
                        : (analysisResult.status || 0) >= 300 && (analysisResult.status || 0) < 400
                        ? 'warning'
                        : 'error'
                    }
                    variant="outlined"
                  />
                }
              />

              <InfoRow
                icon={<CallSplit sx={{ fontSize: 18, color: 'warning.main' }} />}
                label="Redirects"
                value={analysisResult.redirects?.length || 0}
                tooltip="Number of HTTP redirects before reaching final URL"
              />

              <InfoRow
                icon={<Code sx={{ fontSize: 18, color: 'secondary.main' }} />}
                label="JavaScript Required"
                value={
                  analysisResult.js_hints ? (
                    <Chip size="small" label="Yes" color="warning" variant="outlined" />
                  ) : (
                    <Chip size="small" label="No" color="success" variant="outlined" />
                  )
                }
                tooltip="Whether the page requires JavaScript to render content"
              />

              <InfoRow
                icon={<Shield sx={{ fontSize: 18, color: 'error.main' }} />}
                label="Bot Protections"
                value={
                  analysisResult.bot_protections?.length > 0 ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {analysisResult.bot_protections.map((protection: BotProtection, index: number) => (
                        <Chip
                          key={index}
                          size="small"
                          label={protection.type}
                          color="error"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Chip size="small" label="None detected" color="success" variant="outlined" />
                  )
                }
                tooltip="Detected bot protection mechanisms"
              />
            </Stack>

            {/* Redirect Chain */}
            {analysisResult.redirects && analysisResult.redirects.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Redirect Chain
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#f8fafc',
                    p: 1.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {analysisResult.redirects.map((redirect: Redirect, index: number) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip size="small" label={redirect.status} variant="outlined" />
                      <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                        {redirect.from} → {redirect.to}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
