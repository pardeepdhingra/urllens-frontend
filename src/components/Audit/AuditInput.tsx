'use client';

// ============================================================================
// URL Lens - Audit Input Component
// URL/CSV/Domain input with tabs
// ============================================================================

import { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Link as LinkIcon,
  UploadFile,
  Language,
  PlayArrow,
  Clear,
} from '@mui/icons-material';
import type { AuditMode, CSVParseResult } from '@/types/audit';
import { parseCSVFile, parseURLList } from '@/lib/csvParser';

// ============================================================================
// Types
// ============================================================================

interface AuditInputProps {
  onStartAudit: (mode: AuditMode, data: { urls?: string[]; domain?: string }) => void;
  loading: boolean;
  disabled?: boolean;
}

type TabValue = 'urls' | 'csv' | 'domain';

// ============================================================================
// Component
// ============================================================================

export default function AuditInput({
  onStartAudit,
  loading,
  disabled = false,
}: AuditInputProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('urls');
  const [urlInput, setUrlInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [csvResult, setCsvResult] = useState<CSVParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
    setError(null);
  };

  const handleURLInputChange = (value: string) => {
    setUrlInput(value);
    setError(null);

    // Live parse to show URL count
    if (value.trim()) {
      const result = parseURLList(value);
      if (result.urls.length > 0 || result.invalidLines.length > 0) {
        setCsvResult(result);
      } else {
        setCsvResult(null);
      }
    } else {
      setCsvResult(null);
    }
  };

  const handleDomainInputChange = (value: string) => {
    setDomainInput(value);
    setError(null);
  };

  const handleCSVUpload = useCallback(async (file: File) => {
    setError(null);
    try {
      const result = await parseCSVFile(file);
      setCsvResult(result);

      if (result.urls.length === 0) {
        setError('No valid URLs found in the file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      setCsvResult(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleCSVUpload(file);
      }
    },
    [handleCSVUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCSVUpload(file);
    }
  };

  const handleClearCSV = () => {
    setCsvResult(null);
    setError(null);
  };

  const handleStartAudit = () => {
    setError(null);

    if (activeTab === 'urls') {
      const result = parseURLList(urlInput);
      if (result.urls.length === 0) {
        setError('Please enter at least one valid URL');
        return;
      }
      if (result.urls.length > 100) {
        setError('Maximum 100 URLs allowed per batch');
        return;
      }
      onStartAudit('batch', { urls: result.urls });
    } else if (activeTab === 'csv') {
      if (!csvResult || csvResult.urls.length === 0) {
        setError('Please upload a CSV file with valid URLs');
        return;
      }
      if (csvResult.urls.length > 100) {
        setError('Maximum 100 URLs allowed per batch');
        return;
      }
      onStartAudit('batch', { urls: csvResult.urls });
    } else if (activeTab === 'domain') {
      if (!domainInput.trim()) {
        setError('Please enter a domain');
        return;
      }
      onStartAudit('domain', { domain: domainInput.trim() });
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const getStartButtonDisabled = (): boolean => {
    if (loading || disabled) return true;

    if (activeTab === 'urls') {
      return !urlInput.trim();
    } else if (activeTab === 'csv') {
      return !csvResult || csvResult.urls.length === 0;
    } else if (activeTab === 'domain') {
      return !domainInput.trim();
    }
    return true;
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', minHeight: 48 },
        }}
      >
        <Tab
          value="urls"
          label="Multiple URLs"
          icon={<LinkIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          disabled={loading}
        />
        <Tab
          value="csv"
          label="CSV Upload"
          icon={<UploadFile sx={{ fontSize: 18 }} />}
          iconPosition="start"
          disabled={loading}
        />
        <Tab
          value="domain"
          label="Domain Audit"
          icon={<Language sx={{ fontSize: 18 }} />}
          iconPosition="start"
          disabled={loading}
        />
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ p: 3 }}>
        {/* URLs Tab */}
        {activeTab === 'urls' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter URLs separated by commas or new lines. Maximum 100 URLs per batch.
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              value={urlInput}
              onChange={(e) => handleURLInputChange(e.target.value)}
              placeholder="https://example.com&#10;https://example.com/about&#10;https://example.com/blog"
              disabled={loading || disabled}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
              }}
            />
            {csvResult && urlInput.trim() && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${csvResult.urls.length} valid URL${csvResult.urls.length !== 1 ? 's' : ''}`}
                  color="success"
                  size="small"
                />
                {csvResult.invalidLines.length > 0 && (
                  <Chip
                    label={`${csvResult.invalidLines.length} invalid`}
                    color="warning"
                    size="small"
                  />
                )}
                {csvResult.duplicatesRemoved > 0 && (
                  <Chip
                    label={`${csvResult.duplicatesRemoved} duplicate${csvResult.duplicatesRemoved !== 1 ? 's' : ''} removed`}
                    size="small"
                  />
                )}
              </Box>
            )}
          </Box>
        )}

        {/* CSV Upload Tab */}
        {activeTab === 'csv' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file containing URLs. The file is parsed locally and never uploaded to our servers.
            </Typography>

            {!csvResult ? (
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                sx={{
                  border: '2px dashed',
                  borderColor: dragActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: dragActive ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                <UploadFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Drag and drop a CSV file here, or click to browse
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Supports CSV and TXT files (max 5MB)
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" fontWeight={500}>
                    File parsed successfully
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={handleClearCSV}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${csvResult.urls.length} valid URL${csvResult.urls.length !== 1 ? 's' : ''}`}
                    color="success"
                  />
                  {csvResult.invalidLines.length > 0 && (
                    <Chip
                      label={`${csvResult.invalidLines.length} invalid line${csvResult.invalidLines.length !== 1 ? 's' : ''}`}
                      color="warning"
                    />
                  )}
                  {csvResult.duplicatesRemoved > 0 && (
                    <Chip
                      label={`${csvResult.duplicatesRemoved} duplicate${csvResult.duplicatesRemoved !== 1 ? 's' : ''} removed`}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Domain Audit Tab */}
        {activeTab === 'domain' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter a domain to discover and audit URLs. We&apos;ll check sitemaps, robots.txt, and common paths to find testable URLs.
            </Typography>
            <TextField
              fullWidth
              value={domainInput}
              onChange={(e) => handleDomainInputChange(e.target.value)}
              placeholder="example.com"
              disabled={loading || disabled}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
                    https://
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Discovery will find up to 100 URLs from sitemaps and common paths.
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Start Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartAudit}
            disabled={getStartButtonDisabled()}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />
            }
          >
            {loading ? 'Running Audit...' : 'Start Audit'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
