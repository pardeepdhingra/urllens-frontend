'use client';

// ============================================================================
// URL Lens - Audit History Table Component
// Displays user's audit session history
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Delete,
  Visibility,
  Language,
  List as ListIcon,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';

// Simple relative time formatter (no external dependency)
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// Types
// ============================================================================

interface AuditSession {
  id: string;
  mode: 'batch' | 'domain';
  domain: string | null;
  totalUrls: number;
  completedUrls: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  avgScore?: number;
  bestScore?: number;
}

interface AuditHistoryTableProps {
  sessions: AuditSession[];
  loading: boolean;
  onView: (session: AuditSession) => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): 'success' | 'warning' | 'error' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'warning';
  return 'error';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />;
    case 'failed':
      return <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />;
    case 'testing':
      return <Schedule sx={{ fontSize: 16, color: 'info.main' }} />;
    default:
      return <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function AuditHistoryTable({
  sessions,
  loading,
  onView,
  onDelete,
}: AuditHistoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  // Loading state
  if (loading) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Type</TableCell>
              <TableCell>Domain/Batch</TableCell>
              <TableCell align="center">URLs</TableCell>
              <TableCell align="center">Avg Score</TableCell>
              <TableCell align="center">Best Score</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton width={60} /></TableCell>
                <TableCell><Skeleton width={150} /></TableCell>
                <TableCell align="center"><Skeleton width={40} /></TableCell>
                <TableCell align="center"><Skeleton width={50} /></TableCell>
                <TableCell align="center"><Skeleton width={50} /></TableCell>
                <TableCell align="center"><Skeleton width={80} /></TableCell>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell align="right"><Skeleton width={80} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        No audit history yet. Run your first URL audit to see results here.
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>Type</TableCell>
            <TableCell>Domain/Batch</TableCell>
            <TableCell align="center">URLs</TableCell>
            <TableCell align="center">Avg Score</TableCell>
            <TableCell align="center">Best Score</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow
              key={session.id}
              hover
              sx={{
                cursor: 'pointer',
                opacity: deletingId === session.id ? 0.5 : 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => onView(session)}
            >
              {/* Type */}
              <TableCell>
                <Chip
                  icon={session.mode === 'domain' ? <Language sx={{ fontSize: 16 }} /> : <ListIcon sx={{ fontSize: 16 }} />}
                  label={session.mode === 'domain' ? 'Domain' : 'Batch'}
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              </TableCell>

              {/* Domain/Batch */}
              <TableCell>
                <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                  {session.domain || `${session.totalUrls} URLs`}
                </Typography>
              </TableCell>

              {/* URLs */}
              <TableCell align="center">
                <Typography variant="body2">
                  {session.completedUrls}/{session.totalUrls}
                </Typography>
              </TableCell>

              {/* Avg Score */}
              <TableCell align="center">
                {session.avgScore !== undefined ? (
                  <Chip
                    label={session.avgScore}
                    size="small"
                    color={getScoreColor(session.avgScore)}
                    sx={{ fontWeight: 600, minWidth: 50 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">-</Typography>
                )}
              </TableCell>

              {/* Best Score */}
              <TableCell align="center">
                {session.bestScore !== undefined ? (
                  <Chip
                    label={session.bestScore}
                    size="small"
                    color={getScoreColor(session.bestScore)}
                    variant="outlined"
                    sx={{ fontWeight: 600, minWidth: 50 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">-</Typography>
                )}
              </TableCell>

              {/* Status */}
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  {getStatusIcon(session.status)}
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {session.status}
                  </Typography>
                </Box>
              </TableCell>

              {/* Date */}
              <TableCell>
                <Tooltip title={new Date(session.createdAt).toLocaleString()}>
                  <Typography variant="body2" color="text.secondary">
                    {formatRelativeTime(session.createdAt)}
                  </Typography>
                </Tooltip>
              </TableCell>

              {/* Actions */}
              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => onView(session)}>
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(session.id)}
                    disabled={deletingId === session.id}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
