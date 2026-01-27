'use client';

// ============================================================================
// URL Lens - Redirect Timeline with Screenshot Viewer
// Visual display of redirect chain with screenshots
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  Skeleton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ArrowForward,
  Close,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Timer,
  ZoomIn,
  Shield,
  Block,
} from '@mui/icons-material';
import type { VisualAnalysisResult, RedirectScreenshot } from '@/types';

interface RedirectTimelineProps {
  visualAnalysis?: VisualAnalysisResult | null;
  loading?: boolean;
}

interface ScreenshotModalProps {
  open: boolean;
  onClose: () => void;
  screenshot: RedirectScreenshot | null;
  stepNumber: number;
  totalSteps: number;
}

// Blocked reason display mapping
const blockedReasonDisplay: Record<string, { label: string; color: 'error' | 'warning' | 'info'; icon: React.ReactNode }> = {
  cloudflare: { label: 'Cloudflare Protection', color: 'warning', icon: <Shield fontSize="small" /> },
  captcha: { label: 'CAPTCHA Required', color: 'error', icon: <Block fontSize="small" /> },
  rate_limit: { label: 'Rate Limited', color: 'warning', icon: <Timer fontSize="small" /> },
  access_denied: { label: 'Access Denied', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  timeout: { label: 'Timeout', color: 'info', icon: <Timer fontSize="small" /> },
};

function ScreenshotThumbnail({
  screenshot,
  onClick,
  isBlocked,
}: {
  screenshot: RedirectScreenshot;
  onClick: () => void;
  isBlocked: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  // Check if we have valid base64 data (should be long enough to be a real image)
  const hasValidBase64 = screenshot.screenshot_base64 && screenshot.screenshot_base64.length > 100;
  const imageData = hasValidBase64
    ? `data:image/png;base64,${screenshot.screenshot_base64}`
    : screenshot.screenshot_url;

  // Check if this is a redirect hop without screenshot (status 3xx)
  const isRedirectHop = screenshot.status && screenshot.status >= 300 && screenshot.status < 400;
  const hasImage = imageData && !imageError;

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 1,
        overflow: 'hidden',
        border: isBlocked
          ? '2px solid #dc2626'
          : isRedirectHop
            ? '2px solid #f59e0b'
            : '2px solid #e2e8f0',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 3,
          borderColor: isBlocked ? '#dc2626' : '#3b82f6',
        },
        width: 200,
        height: 125,
        bgcolor: isRedirectHop ? '#fef3c7' : '#f1f5f9',
      }}
    >
      {hasImage ? (
        <Box
          component="img"
          src={imageData}
          alt={`Step ${screenshot.step} - ${screenshot.url}`}
          onError={() => {
            setImageError(true);
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isRedirectHop ? '#fef3c7' : '#e2e8f0',
            p: 1,
          }}
        >
          {isRedirectHop ? (
            <>
              <ArrowForward sx={{ fontSize: 32, color: '#d97706', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                HTTP {screenshot.status}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Redirect
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview
            </Typography>
          )}
        </Box>
      )}

      {/* Zoom indicator - only show if we have an image */}
      {hasImage && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
            opacity: 0.7,
          }}
        >
          <ZoomIn sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      )}

      {/* Status badge for redirects without screenshot */}
      {!hasImage && screenshot.status && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            bgcolor: isRedirectHop ? '#f59e0b' : '#6b7280',
            borderRadius: 1,
            px: 1,
            py: 0.25,
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
            {screenshot.status}
          </Typography>
        </Box>
      )}

      {/* Blocked overlay */}
      {isBlocked && screenshot.blocked_reason && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            px: 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {blockedReasonDisplay[screenshot.blocked_reason]?.icon}
          <Typography variant="caption" fontWeight={500}>
            {blockedReasonDisplay[screenshot.blocked_reason]?.label || 'Blocked'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function ScreenshotModal({ open, onClose, screenshot, stepNumber, totalSteps }: ScreenshotModalProps) {
  if (!screenshot) return null;

  const imageData = screenshot.screenshot_base64
    ? `data:image/png;base64,${screenshot.screenshot_base64}`
    : screenshot.screenshot_url;

  const statusColor =
    screenshot.status && screenshot.status >= 200 && screenshot.status < 400
      ? 'success'
      : screenshot.status && screenshot.status >= 400
      ? 'error'
      : 'default';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">
            Step {stepNumber} of {totalSteps}
          </Typography>
          {screenshot.page_title && (
            <Typography variant="body2" color="text.secondary">
              {screenshot.page_title}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} edge="end">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {/* URL and Status */}
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1 }}>
            <Typography
              variant="body2"
              fontFamily="monospace"
              sx={{ wordBreak: 'break-all', mb: 1 }}
            >
              {screenshot.url}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {screenshot.status && (
                <Chip
                  label={`Status: ${screenshot.status}`}
                  size="small"
                  color={statusColor as 'success' | 'error' | 'default'}
                  variant="outlined"
                />
              )}
              <Chip
                label={new Date(screenshot.timestamp).toLocaleTimeString()}
                size="small"
                variant="outlined"
              />
              {screenshot.blocked_reason && (
                <Chip
                  icon={blockedReasonDisplay[screenshot.blocked_reason]?.icon as React.ReactElement}
                  label={blockedReasonDisplay[screenshot.blocked_reason]?.label || 'Blocked'}
                  size="small"
                  color={blockedReasonDisplay[screenshot.blocked_reason]?.color || 'error'}
                />
              )}
            </Stack>
          </Box>

          {/* Screenshot */}
          {imageData ? (
            <Box
              component="img"
              src={imageData}
              alt={`Screenshot of ${screenshot.url}`}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '60vh',
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid #e2e8f0',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f1f5f9',
                borderRadius: 1,
              }}
            >
              <Typography color="text.secondary">Screenshot not available</Typography>
            </Box>
          )}

          {/* Blocked warning */}
          {screenshot.blocked_reason && (
            <Alert severity="warning">
              This page showed signs of {blockedReasonDisplay[screenshot.blocked_reason]?.label || 'blocking'}.
              Visual inspection may be required to verify content accessibility.
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export function RedirectTimeline({ visualAnalysis, loading }: RedirectTimelineProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<RedirectScreenshot | null>(null);

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Visual Redirect Timeline
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', py: 2 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="rectangular" width={200} height={125} sx={{ borderRadius: 1 }} />
              {i < 3 && <ArrowForward sx={{ color: '#9ca3af' }} />}
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Visual analysis disabled (e.g., on Vercel serverless)
  if (visualAnalysis?.disabled) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Visual Redirect Timeline
        </Typography>
        <Alert severity="warning">
          {visualAnalysis.disabled_reason || 'Visual analysis is not available in this deployment environment.'}
        </Alert>
      </Paper>
    );
  }

  // No visual analysis available
  if (!visualAnalysis || visualAnalysis.screenshots.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Visual Redirect Timeline
        </Typography>
        <Alert severity="info">
          No visual analysis available. Enable visual analysis when analyzing a URL to capture
          screenshots of the redirect chain.
        </Alert>
      </Paper>
    );
  }

  const { screenshots, total_redirects, blocked, blocked_at_step, analysis_duration_ms } = visualAnalysis;

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Visual Redirect Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''} captured •{' '}
            {total_redirects} redirect{total_redirects !== 1 ? 's' : ''} • {analysis_duration_ms}ms
          </Typography>
        </Box>
        {blocked && (
          <Chip
            icon={<Warning />}
            label={`Blocked at step ${blocked_at_step}`}
            color="error"
            size="small"
          />
        )}
      </Box>

      {/* Timeline */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          py: 2,
          px: 1,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#f1f5f9',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#cbd5e1',
            borderRadius: 4,
            '&:hover': {
              bgcolor: '#94a3b8',
            },
          },
        }}
      >
        {screenshots.map((screenshot, index) => (
          <Box key={screenshot.step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Screenshot card */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {/* Step indicator */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: screenshot.blocked_reason ? '#fef2f2' : '#f0fdf4',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                {screenshot.blocked_reason ? (
                  <ErrorIcon sx={{ fontSize: 14, color: '#dc2626' }} />
                ) : (
                  <CheckCircle sx={{ fontSize: 14, color: '#16a34a' }} />
                )}
                <Typography variant="caption" fontWeight={600}>
                  Step {screenshot.step}
                </Typography>
              </Box>

              {/* Screenshot thumbnail */}
              <ScreenshotThumbnail
                screenshot={screenshot}
                onClick={() => setSelectedScreenshot(screenshot)}
                isBlocked={!!screenshot.blocked_reason}
              />

              {/* URL (truncated) */}
              <Tooltip title={screenshot.url}>
                <Typography
                  variant="caption"
                  sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'text.secondary',
                    fontFamily: 'monospace',
                    fontSize: '0.65rem',
                  }}
                >
                  {new URL(screenshot.url).hostname}
                </Typography>
              </Tooltip>
            </Box>

            {/* Arrow between steps */}
            {index < screenshots.length - 1 && (
              <ArrowForward sx={{ color: '#9ca3af', flexShrink: 0 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* Summary */}
      {blocked && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Bot protection detected!</strong> The redirect chain was blocked at step{' '}
          {blocked_at_step}. Click on the screenshot to see what the crawler would see.
        </Alert>
      )}

      {/* Modal */}
      <ScreenshotModal
        open={!!selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
        screenshot={selectedScreenshot}
        stepNumber={selectedScreenshot?.step || 0}
        totalSteps={screenshots.length}
      />
    </Paper>
  );
}

export default RedirectTimeline;
