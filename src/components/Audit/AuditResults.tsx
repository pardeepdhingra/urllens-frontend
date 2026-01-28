'use client';

// ============================================================================
// URL Lens - Audit Results Component
// Results table with sorting, filtering, and export
// ============================================================================

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  Collapse,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Download,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  Warning,
  OpenInNew,
} from '@mui/icons-material';
import type { URLAuditResult, AuditSummary, AuditRecommendation } from '@/types/audit';
import { downloadCSV, downloadJSON, resultsToCSV } from '@/lib/csvParser';

// ============================================================================
// Types
// ============================================================================

interface AuditResultsProps {
  results: URLAuditResult[];
  summary: AuditSummary;
}

type SortField = 'url' | 'status' | 'scrapeLikelihoodScore' | 'recommendation';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// Helper Components
// ============================================================================

function ScoreChip({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Chip
      label={score}
      size="small"
      color={getColor()}
      sx={{ minWidth: 50, fontWeight: 600 }}
    />
  );
}

function RecommendationChip({ recommendation }: { recommendation: AuditRecommendation }) {
  const config: Record<AuditRecommendation, { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' }> = {
    best_entry_point: { label: 'Best Entry Point', color: 'success' },
    good: { label: 'Good', color: 'info' },
    moderate: { label: 'Moderate', color: 'warning' },
    challenging: { label: 'Challenging', color: 'error' },
    blocked: { label: 'Blocked', color: 'default' },
  };

  const { label, color } = config[recommendation];

  return <Chip label={label} size="small" color={color} variant="outlined" />;
}

function StatusIcon({ accessible }: { accessible: boolean }) {
  if (accessible) {
    return <CheckCircle fontSize="small" color="success" />;
  }
  return <Cancel fontSize="small" color="error" />;
}

// ============================================================================
// Summary Cards
// ============================================================================

function SummaryCards({ summary }: { summary: AuditSummary }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            {summary.totalUrls}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total URLs
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'success.main', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="success.main">
            {summary.accessibleCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accessible
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'error.main', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} color="error.main">
            {summary.blockedCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Blocked
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700}>
            {summary.averageScore}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Score
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ============================================================================
// Expandable Row
// ============================================================================

function ResultRow({ result }: { result: URLAuditResult }) {
  const [expanded, setExpanded] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(result.url);
  };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell>
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatusIcon accessible={result.accessible} />
            <Tooltip title={result.url}>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {result.url}
              </Typography>
            </Tooltip>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={result.status || 'N/A'}
            size="small"
            color={result.status === 200 ? 'success' : result.status >= 400 ? 'error' : 'default'}
            variant="outlined"
          />
        </TableCell>
        <TableCell align="center">
          <ScoreChip score={result.scrapeLikelihoodScore} />
        </TableCell>
        <TableCell>
          <RecommendationChip recommendation={result.recommendation} />
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Copy URL">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyUrl();
              }}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open URL">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(result.url, '_blank');
              }}
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3 }}>
              <Grid container spacing={3}>
                {/* URL Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    URL Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {result.finalUrl !== result.url && (
                      <Typography variant="body2">
                        <strong>Final URL:</strong> {result.finalUrl}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Content Type:</strong> {result.contentType || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Response Time:</strong> {result.responseTimeMs ? `${result.responseTimeMs}ms` : 'N/A'}
                    </Typography>
                    {result.blockedReason && (
                      <Typography variant="body2" color="error.main">
                        <strong>Blocked Reason:</strong> {result.blockedReason}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Detections */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detections
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {result.jsRequired ? (
                        <Warning fontSize="small" color="warning" />
                      ) : (
                        <CheckCircle fontSize="small" color="success" />
                      )}
                      <Typography variant="body2">
                        {result.jsRequired ? 'JavaScript Required' : 'No JavaScript Required'}
                      </Typography>
                    </Box>
                    {result.botProtections.length > 0 ? (
                      <Box>
                        <Typography variant="body2" color="warning.main">
                          <strong>Bot Protections:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {result.botProtections.map((protection) => (
                            <Chip key={protection} label={protection} size="small" color="warning" />
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle fontSize="small" color="success" />
                        <Typography variant="body2">No Bot Protection Detected</Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Redirects */}
                {result.redirects.length > 0 && (
                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Redirect Chain ({result.redirects.length} redirect{result.redirects.length !== 1 ? 's' : ''})
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {result.redirects.map((redirect, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                          <Chip label={redirect.status} size="small" variant="outlined" />
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {redirect.from} → {redirect.to}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* Score Breakdown */}
                <Grid size={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Score Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {Object.entries(result.scoreBreakdown).map(([key, value]) => {
                      if (key === 'total') return null;
                      const maxScores: Record<string, number> = {
                        httpStatus: 40,
                        jsRequired: 20,
                        htmlResponse: 15,
                        botProtection: 15,
                        redirectChain: 10,
                      };
                      const max = maxScores[key] || 100;
                      const labels: Record<string, string> = {
                        httpStatus: 'HTTP Status',
                        jsRequired: 'No JS Required',
                        htmlResponse: 'HTML Response',
                        botProtection: 'No Bot Protection',
                        redirectChain: 'Short Redirects',
                      };

                      return (
                        <Box key={key} sx={{ minWidth: 150 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {labels[key] || key}
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {value}/{max}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(value / max) * 100}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AuditResults({ results, summary }: AuditResultsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('scrapeLikelihoodScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.url.toLowerCase().includes(query) ||
          r.recommendation.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === 'status') {
        aVal = a.status || 0;
        bVal = b.status || 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [results, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    const csv = resultsToCSV(results as unknown as Record<string, unknown>[], [
      { key: 'url', header: 'URL' },
      { key: 'status', header: 'Status' },
      { key: 'accessible', header: 'Accessible' },
      { key: 'scrapeLikelihoodScore', header: 'Score' },
      { key: 'recommendation', header: 'Recommendation' },
      { key: 'finalUrl', header: 'Final URL' },
      { key: 'jsRequired', header: 'JS Required' },
      { key: 'contentType', header: 'Content Type' },
      { key: 'responseTimeMs', header: 'Response Time (ms)' },
    ]);
    downloadCSV(csv, `url-audit-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportJSON = () => {
    downloadJSON({ summary, results }, `url-audit-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <Box>
      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Best Entry Points */}
      {summary.bestEntryPoints.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'success.main',
            backgroundColor: 'success.50',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="success.dark" gutterBottom>
            Best Entry Points ({summary.bestEntryPoints.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {summary.bestEntryPoints.map((result) => (
              <Chip
                key={result.url}
                label={result.url}
                color="success"
                onClick={() => window.open(result.url, '_blank')}
                deleteIcon={<OpenInNew />}
                onDelete={() => window.open(result.url, '_blank')}
                sx={{ maxWidth: 300 }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search URLs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleExportJSON}
          >
            Export JSON
          </Button>
        </Box>
      </Box>

      {/* Results Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell width={50} />
              <TableCell>
                <TableSortLabel
                  active={sortField === 'url'}
                  direction={sortField === 'url' ? sortDirection : 'asc'}
                  onClick={() => handleSort('url')}
                >
                  URL
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortDirection : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'scrapeLikelihoodScore'}
                  direction={sortField === 'scrapeLikelihoodScore' ? sortDirection : 'asc'}
                  onClick={() => handleSort('scrapeLikelihoodScore')}
                >
                  Score
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'recommendation'}
                  direction={sortField === 'recommendation' ? sortDirection : 'asc'}
                  onClick={() => handleSort('recommendation')}
                >
                  Recommendation
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResults.map((result) => (
              <ResultRow key={result.url} result={result} />
            ))}
            {filteredResults.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? 'No URLs match your search' : 'No results'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Result Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'right' }}>
        Showing {filteredResults.length} of {results.length} URLs
      </Typography>
    </Box>
  );
}
