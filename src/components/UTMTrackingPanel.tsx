'use client';

// ============================================================================
// URL Lens - UTM & Parameter Tracking Panel
// Visualizes how URL parameters flow through redirect chains
// ============================================================================

import {
  Box,
  Typography,
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  ExpandMore,
  ArrowForward,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { UTMAnalysisResult, ParameterChange, RedirectParameterState } from '@/types';

interface UTMTrackingPanelProps {
  utmAnalysis?: UTMAnalysisResult | null;
}

// Standard UTM parameters for highlighting
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];

function ParamChip({
  name,
  value,
  change,
}: {
  name: string;
  value?: string;
  change?: ParameterChange['action'];
}) {
  const isUtm = UTM_PARAMS.includes(name.toLowerCase());

  const getColor = () => {
    if (change === 'removed') return 'error';
    if (change === 'added') return 'success';
    if (change === 'modified') return 'warning';
    if (isUtm) return 'primary';
    return 'default';
  };

  const getVariant = () => {
    if (change === 'removed') return 'outlined';
    return 'filled';
  };

  return (
    <Tooltip title={value ? `${name}=${value}` : name}>
      <Chip
        label={name}
        size="small"
        color={getColor()}
        variant={getVariant()}
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          textDecoration: change === 'removed' ? 'line-through' : 'none',
          opacity: change === 'removed' ? 0.6 : 1,
        }}
      />
    </Tooltip>
  );
}

function ParameterFlowStep({
  state,
  isFirst,
  isLast,
}: {
  state: RedirectParameterState;
  isFirst: boolean;
  isLast: boolean;
}) {
  const paramKeys = Object.keys(state.allParams);
  const utmKeys = Object.keys(state.utmParams);
  const hasParams = paramKeys.length > 0;

  // Get hostname from URL for display
  let hostname = '';
  try {
    hostname = new URL(state.url).hostname;
  } catch {
    hostname = state.url;
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: isLast ? '#f0fdf4' : '#f8fafc',
        borderRadius: 1,
        border: isLast ? '2px solid #16a34a' : '1px solid #e2e8f0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={`Step ${state.step}`}
          size="small"
          color={isLast ? 'success' : 'default'}
          sx={{ fontWeight: 600 }}
        />
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {hostname}
        </Typography>
      </Box>

      {/* Changes from previous step */}
      {!isFirst && state.changes.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          {state.changes.filter(c => c.action !== 'preserved').map((change, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {change.action === 'removed' && (
                <>
                  <ErrorIcon sx={{ fontSize: 14, color: '#dc2626' }} />
                  <Typography variant="caption" color="error">
                    <strong>{change.name}</strong> removed
                  </Typography>
                </>
              )}
              {change.action === 'added' && (
                <>
                  <CheckCircle sx={{ fontSize: 14, color: '#16a34a' }} />
                  <Typography variant="caption" color="success.main">
                    <strong>{change.name}</strong> added
                  </Typography>
                </>
              )}
              {change.action === 'modified' && (
                <>
                  <Warning sx={{ fontSize: 14, color: '#d97706' }} />
                  <Typography variant="caption" color="warning.main">
                    <strong>{change.name}</strong> changed
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Parameters at this step */}
      {hasParams ? (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {paramKeys.map((key) => (
            <ParamChip
              key={key}
              name={key}
              value={state.allParams[key]}
              change={!isFirst ? state.changes.find(c => c.name === key)?.action : undefined}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No query parameters
        </Typography>
      )}

      {/* UTM summary */}
      {utmKeys.length > 0 && (
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
            UTM: {utmKeys.join(', ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function IssuesList({ issues }: { issues: UTMAnalysisResult['issues'] }) {
  if (issues.length === 0) return null;

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {issues.map((issue, i) => (
        <Alert
          key={i}
          severity={issue.severity}
          icon={
            issue.severity === 'error' ? (
              <ErrorIcon />
            ) : issue.severity === 'warning' ? (
              <Warning />
            ) : (
              <Info />
            )
          }
          sx={{ py: 0.5 }}
        >
          <Typography variant="body2">{issue.message}</Typography>
          {issue.step && (
            <Typography variant="caption" color="text.secondary">
              at redirect step {issue.step}
            </Typography>
          )}
        </Alert>
      ))}
    </Stack>
  );
}

function ParameterComparisonTable({
  initial,
  final,
  changes,
}: {
  initial: Record<string, string>;
  final: Record<string, string>;
  changes: { added: string[]; removed: string[]; modified: string[] };
}) {
  const allKeys = [...new Set([...Object.keys(initial), ...Object.keys(final)])].sort();

  if (allKeys.length === 0) {
    return (
      <Alert severity="info" icon={<Info />}>
        No query parameters found in the URL chain.
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Parameter</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Initial Value</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Final Value</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allKeys.map((key) => {
            const isUtm = UTM_PARAMS.includes(key.toLowerCase());
            const initialVal = initial[key];
            const finalVal = final[key];
            const isRemoved = changes.removed.includes(key);
            const isAdded = changes.added.includes(key);
            const isModified = changes.modified.includes(key);

            return (
              <TableRow
                key={key}
                sx={{
                  bgcolor: isRemoved
                    ? '#fef2f2'
                    : isAdded
                      ? '#f0fdf4'
                      : isModified
                        ? '#fffbeb'
                        : isUtm
                          ? '#eff6ff'
                          : undefined,
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      fontWeight={isUtm ? 600 : 400}
                    >
                      {key}
                    </Typography>
                    {isUtm && (
                      <Chip label="UTM" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    fontSize="0.75rem"
                    sx={{
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: isRemoved ? 'line-through' : 'none',
                    }}
                  >
                    {initialVal || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontFamily="monospace"
                    fontSize="0.75rem"
                    sx={{
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {finalVal || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {isRemoved && (
                    <Chip label="Removed" size="small" color="error" sx={{ height: 20 }} />
                  )}
                  {isAdded && (
                    <Chip label="Added" size="small" color="success" sx={{ height: 20 }} />
                  )}
                  {isModified && (
                    <Chip label="Modified" size="small" color="warning" sx={{ height: 20 }} />
                  )}
                  {!isRemoved && !isAdded && !isModified && (
                    <Chip label="Preserved" size="small" color="default" variant="outlined" sx={{ height: 20 }} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function UTMTrackingPanel({ utmAnalysis }: UTMTrackingPanelProps) {
  if (!utmAnalysis) {
    return (
      <Alert severity="info" icon={<LinkIcon />}>
        UTM tracking analysis not available.
      </Alert>
    );
  }

  const { hasUtmParams, utmPreserved, parameterFlow, issues, initialParams, finalParams, paramsAdded, paramsRemoved, paramsModified } = utmAnalysis;

  return (
    <Stack spacing={3}>
      {/* Summary */}
      <Box>
        {hasUtmParams ? (
          utmPreserved ? (
            <Alert severity="success" icon={<CheckCircle />}>
              <strong>UTM Parameters Preserved!</strong> All UTM tracking parameters made it through
              the redirect chain successfully.
            </Alert>
          ) : (
            <Alert severity="error" icon={<ErrorIcon />}>
              <strong>UTM Parameters Lost or Modified!</strong> Some tracking parameters were
              stripped or changed during redirects. This may affect your analytics.
            </Alert>
          )
        ) : (
          <Alert severity="info" icon={<Info />}>
            No UTM parameters were present in the initial URL. Add UTM parameters to track
            campaign performance (e.g., ?utm_source=google&utm_medium=cpc).
          </Alert>
        )}
      </Box>

      {/* Issues */}
      <IssuesList issues={issues} />

      {/* Parameter Flow Visualization */}
      {parameterFlow.length > 1 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowForward color="action" />
              <Typography fontWeight={500}>
                Parameter Flow ({parameterFlow.length} steps)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {parameterFlow.map((state, i) => (
                <Box key={state.step}>
                  <ParameterFlowStep
                    state={state}
                    isFirst={i === 0}
                    isLast={i === parameterFlow.length - 1}
                  />
                  {i < parameterFlow.length - 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                      <ArrowForward sx={{ color: '#9ca3af' }} />
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Parameter Comparison Table */}
      <Accordion defaultExpanded={parameterFlow.length <= 1}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon color="action" />
            <Typography fontWeight={500}>
              Parameter Comparison (Initial vs Final)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <ParameterComparisonTable
            initial={initialParams}
            final={finalParams}
            changes={{
              added: paramsAdded,
              removed: paramsRemoved,
              modified: paramsModified,
            }}
          />
        </AccordionDetails>
      </Accordion>

      {/* Quick Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 2,
        }}
      >
        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
          <Typography variant="h5" color={paramsRemoved.length > 0 ? 'error.main' : 'text.primary'}>
            {paramsRemoved.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Removed
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
          <Typography variant="h5" color={paramsModified.length > 0 ? 'warning.main' : 'text.primary'}>
            {paramsModified.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Modified
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
          <Typography variant="h5" color="success.main">
            {paramsAdded.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Added
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
          <Typography variant="h5">
            {Object.keys(finalParams).length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Final Total
          </Typography>
        </Paper>
      </Box>
    </Stack>
  );
}

export default UTMTrackingPanel;
