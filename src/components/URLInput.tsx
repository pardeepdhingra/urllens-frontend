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
} from '@mui/material';
import { Search, Link as LinkIcon } from '@mui/icons-material';
import type { URLInputProps } from '@/types';

export default function URLInput({
  onAnalyze,
  loading,
  disabled = false,
}: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError('Please enter a URL');
      return false;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;
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
      await onAnalyze(url.trim());
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
    <Box
      component="form"
      onSubmit={handleSubmit}
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
  );
}
