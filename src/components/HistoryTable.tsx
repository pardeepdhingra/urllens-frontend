'use client';

// ============================================================================
// URL Lens - History Table Component
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
  IconButton,
  Chip,
  Typography,
  Tooltip,
  Skeleton,
  Alert,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Refresh,
  Delete,
  OpenInNew,
  Shield,
  Code,
  Visibility,
} from '@mui/icons-material';
import type { HistoryTableProps } from '@/types';
import { getScoreColor } from '@/lib/scoringEngine';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

export default function HistoryTable({
  history,
  onRerun,
  onDelete,
  onView,
  loading,
}: HistoryTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">JS</TableCell>
              <TableCell align="center">Protection</TableCell>
              <TableCell align="right">Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton width="80%" /></TableCell>
                <TableCell><Skeleton width={50} /></TableCell>
                <TableCell><Skeleton width={40} /></TableCell>
                <TableCell><Skeleton width={40} /></TableCell>
                <TableCell><Skeleton width={60} /></TableCell>
                <TableCell><Skeleton width={60} /></TableCell>
                <TableCell><Skeleton width={80} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Alert severity="info">
        No analysis history yet. Analyze a URL to get started!
      </Alert>
    );
  }

  const paginatedHistory = history.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell align="center" sx={{ minWidth: 80 }}>Score</TableCell>
              <TableCell align="center" sx={{ minWidth: 70 }}>Status</TableCell>
              <TableCell align="center" sx={{ minWidth: 60 }}>JS</TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}>Protection</TableCell>
              <TableCell align="right" sx={{ minWidth: 80 }}>Date</TableCell>
              <TableCell align="right" sx={{ minWidth: 100 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedHistory.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Tooltip title={item.url} arrow placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {truncateUrl(item.url)}
                      </Typography>
                      <IconButton
                        size="small"
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                      >
                        <OpenInNew sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Tooltip>
                </TableCell>

                <TableCell align="center">
                  <Chip
                    label={item.score}
                    size="small"
                    color={getScoreColor(item.score)}
                    sx={{ fontWeight: 600, minWidth: 50 }}
                  />
                </TableCell>

                <TableCell align="center">
                  {item.status_code ? (
                    <Chip
                      label={item.status_code}
                      size="small"
                      variant="outlined"
                      color={
                        item.status_code >= 200 && item.status_code < 300
                          ? 'success'
                          : item.status_code >= 300 && item.status_code < 400
                          ? 'warning'
                          : 'error'
                      }
                    />
                  ) : (
                    <Typography color="text.disabled">-</Typography>
                  )}
                </TableCell>

                <TableCell align="center">
                  {item.js_required ? (
                    <Tooltip title="JavaScript required">
                      <Code color="warning" sx={{ fontSize: 20 }} />
                    </Tooltip>
                  ) : (
                    <Typography color="text.disabled">-</Typography>
                  )}
                </TableCell>

                <TableCell align="center">
                  {item.bot_protections && item.bot_protections.length > 0 ? (
                    <Tooltip
                      title={item.bot_protections.map((p) => p.type).join(', ')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Shield color="error" sx={{ fontSize: 18 }} />
                        <Typography variant="caption" color="error">
                          {item.bot_protections.length}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Typography color="text.disabled">-</Typography>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Tooltip title={new Date(item.created_at).toLocaleString()}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(item.created_at)}
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell align="right">
                  <Tooltip title="View analysis">
                    <IconButton
                      size="small"
                      onClick={() => onView(item)}
                      color="info"
                    >
                      <Visibility sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Re-run analysis">
                    <IconButton
                      size="small"
                      onClick={() => onRerun(item.url)}
                      color="primary"
                    >
                      <Refresh sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(item.id)}
                      color="error"
                    >
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={history.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Analysis?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this analysis record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
