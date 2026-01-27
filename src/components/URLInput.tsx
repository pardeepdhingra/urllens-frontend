'use client';

// ============================================================================
// URL Lens - URL Input Component
// ============================================================================

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from '@mui/material';
import { Search, Link as LinkIcon, CameraAlt, Analytics } from '@mui/icons-material';
import type { URLInputProps } from '@/types';

export default function URLInput({
  onAnalyze,
  loading,
  disabled = false,
}: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [visualAnalysis, setVisualAnalysis] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState(true); // Default to enabled

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError('Please enter a URL');
      return false;
    }

    // Basic URL validation - supports paths, query params, and fragments
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(:[0-9]+)?(\/[^\s]*)?(\?[^\s]*)?$/i;
    if (!urlPattern.test(input.trim())) {
      setError('Please enter a valid URL');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) return;

    try {
      await onAnalyze(url.trim(), { visualAnalysis, seoAnalysis });
    } catch {
      // Error handling is done in parent component
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <TextField
          fullWidth
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL to analyze (e.g., https://example.com)"
          disabled={loading || disabled}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon color={error ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || disabled || !url.trim()}
          sx={{
            minWidth: { xs: '100%', sm: 140 },
            height: { sm: 56 },
            whiteSpace: 'nowrap',
          }}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Search />
            )
          }
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </Box>

      {/* Analysis Options */}
      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {/* SEO Analysis Option */}
        <Tooltip
          title="Analyze SEO, AEO (Answer Engine), GEO (Generative Engine), and LLMO (LLM Optimization) scores with actionable recommendations."
          arrow
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={seoAnalysis}
                onChange={(e) => setSeoAnalysis(e.target.checked)}
                disabled={loading || disabled}
                size="small"
                icon={<Analytics sx={{ color: 'action.disabled' }} />}
                checkedIcon={<Analytics sx={{ color: 'primary.main' }} />}
              />
            }
            label={
              <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                SEO/AEO/GEO/LLMO Analysis{' '}
                <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                  (recommended)
                </Box>
              </Box>
            }
          />
        </Tooltip>

        {/* Visual Analysis Option */}
        <Tooltip
          title="Capture screenshots at each redirect step using a real browser. Takes longer but provides visual proof of bot protection."
          arrow
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={visualAnalysis}
                onChange={(e) => setVisualAnalysis(e.target.checked)}
                disabled={loading || disabled}
                size="small"
                icon={<CameraAlt sx={{ color: 'action.disabled' }} />}
                checkedIcon={<CameraAlt sx={{ color: 'primary.main' }} />}
              />
            }
            label={
              <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                Visual Analysis{' '}
                <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                  (screenshots, +10-30s)
                </Box>
              </Box>
            }
          />
        </Tooltip>
      </Box>
    </Box>
  );
}
