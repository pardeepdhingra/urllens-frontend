'use client';

// ============================================================================
// URL Lens - Audit Progress Component
// Progress tracking stepper with live updates
// ============================================================================

import {
  Box,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import {
  Search,
  Speed,
  Analytics,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { AuditProgress as AuditProgressType, AuditStatus } from '@/types/audit';

// ============================================================================
// Types
// ============================================================================

interface AuditProgressProps {
  progress: AuditProgressType;
  error?: string | null;
}

// ============================================================================
// Step Configuration
// ============================================================================

interface StepConfig {
  status: AuditStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    status: 'discovering',
    label: 'Discovering URLs',
    description: 'Finding URLs from sitemaps and common paths',
    icon: <Search />,
  },
  {
    status: 'testing',
    label: 'Testing Accessibility',
    description: 'Checking HTTP status and redirect chains',
    icon: <Speed />,
  },
  {
    status: 'scoring',
    label: 'Scoring URLs',
    description: 'Calculating scrape likelihood scores',
    icon: <Analytics />,
  },
  {
    status: 'completed',
    label: 'Complete',
    description: 'Audit finished',
    icon: <CheckCircle />,
  },
];

// ============================================================================
// Component
// ============================================================================

export default function AuditProgress({ progress, error }: AuditProgressProps) {
  // Get the current step index based on status
  const getCurrentStepIndex = (): number => {
    if (progress.status === 'failed' || error) return -1;
    const index = STEPS.findIndex((step) => step.status === progress.status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCompleted = progress.status === 'completed';
  const isFailed = progress.status === 'failed' || !!error;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isFailed ? 'error.main' : isCompleted ? 'success.main' : 'divider',
        borderRadius: 2,
        p: 3,
        backgroundColor: isFailed
          ? 'error.50'
          : isCompleted
          ? 'success.50'
          : 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {isFailed ? 'Audit Failed' : isCompleted ? 'Audit Complete' : 'Audit in Progress'}
        </Typography>
        {!isFailed && (
          <Chip
            label={`${progress.completedUrls} / ${progress.totalUrls} URLs`}
            size="small"
            color={isCompleted ? 'success' : 'default'}
          />
        )}
      </Box>

      {/* Progress Bar */}
      {!isFailed && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {progress.currentStep}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.percentComplete}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress.percentComplete}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: isCompleted ? 'success.main' : 'primary.main',
              },
            }}
          />
        </Box>
      )}

      {/* Error Message */}
      {isFailed && (error || progress.error) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            mb: 3,
            p: 2,
            backgroundColor: 'error.light',
            borderRadius: 1,
          }}
        >
          <ErrorIcon color="error" />
          <Typography variant="body2" color="error.dark">
            {error || progress.error}
          </Typography>
        </Box>
      )}

      {/* Stepper */}
      <Stepper
        activeStep={isFailed ? -1 : currentStepIndex}
        alternativeLabel
        sx={{
          '& .MuiStepLabel-label': {
            mt: 1,
            fontSize: '0.75rem',
          },
        }}
      >
        {STEPS.map((step, index) => {
          const isActive = index === currentStepIndex && !isFailed;
          const isStepCompleted = index < currentStepIndex || isCompleted;

          return (
            <Step key={step.status} completed={isStepCompleted}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isStepCompleted
                        ? 'success.main'
                        : isActive
                        ? 'primary.main'
                        : 'action.disabledBackground',
                      color: isStepCompleted || isActive ? 'white' : 'text.disabled',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isStepCompleted ? <CheckCircle fontSize="small" /> : step.icon}
                  </Box>
                )}
              >
                <Typography
                  variant="body2"
                  fontWeight={isActive ? 600 : 400}
                  color={isActive ? 'text.primary' : 'text.secondary'}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {/* Discovery Info */}
      {progress.discoveredUrls !== undefined && progress.discoveredUrls > 0 && (
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{progress.discoveredUrls}</strong> URLs discovered from domain
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
