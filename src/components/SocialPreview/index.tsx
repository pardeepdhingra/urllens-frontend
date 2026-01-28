'use client';

// ============================================================================
// URL Lens - Social Media Preview Component
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Facebook,
  LinkedIn,
  Google,
  Refresh,
  ExpandMore,
  ExpandLess,
  Warning,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';
import { SocialPreviewResult, SocialPlatformWarning } from '@/types';
import FacebookPreview from './FacebookPreview';
import LinkedInPreview from './LinkedInPreview';
import GooglePreview from './GooglePreview';
import TwitterPreview from './TwitterPreview';
import WhatsAppPreview from './WhatsAppPreview';
import TelegramPreview from './TelegramPreview';

// Custom icons for platforms not in MUI
const XIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

interface SocialPreviewProps {
  url?: string;
  analysisId?: string;
}

type Platform = 'facebook' | 'linkedin' | 'google' | 'twitter' | 'whatsapp' | 'telegram';

const PLATFORM_INFO: Record<Platform, { label: string; icon: React.ReactNode }> = {
  facebook: { label: 'Facebook', icon: <Facebook /> },
  linkedin: { label: 'LinkedIn', icon: <LinkedIn /> },
  google: { label: 'Google', icon: <Google /> },
  twitter: { label: 'X (Twitter)', icon: <XIcon /> },
  whatsapp: { label: 'WhatsApp', icon: <WhatsAppIcon /> },
  telegram: { label: 'Telegram', icon: <TelegramIcon /> },
};

export default function SocialPreview({ url, analysisId }: SocialPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SocialPreviewResult | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('facebook');
  const [showMetadata, setShowMetadata] = useState(false);

  const fetchPreview = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch social preview');
      }

      setPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      fetchPreview();
    }
  }, [url]);

  const handlePlatformChange = (_: React.SyntheticEvent, newValue: Platform) => {
    setSelectedPlatform(newValue);
  };

  const getWarningIcon = (type: SocialPlatformWarning['type']) => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <Warning color="warning" fontSize="small" />;
      case 'info':
        return <Info color="info" fontSize="small" />;
    }
  };

  const getWarningCount = (platform: Platform) => {
    if (!preview) return 0;
    return preview.platforms[platform].warnings.length;
  };

  const renderPlatformPreview = () => {
    if (!preview) return null;

    const platformData = preview.platforms[selectedPlatform];

    switch (selectedPlatform) {
      case 'facebook':
        return <FacebookPreview data={platformData} />;
      case 'linkedin':
        return <LinkedInPreview data={platformData} />;
      case 'google':
        return <GooglePreview data={platformData} />;
      case 'twitter':
        return <TwitterPreview data={platformData} />;
      case 'whatsapp':
        return <WhatsAppPreview data={platformData} />;
      case 'telegram':
        return <TelegramPreview data={platformData} />;
    }
  };

  if (!url) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Enter a URL above to see social media previews
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Platform Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={selectedPlatform}
          onChange={handlePlatformChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {(Object.keys(PLATFORM_INFO) as Platform[]).map((platform) => (
            <Tab
              key={platform}
              value={platform}
              icon={PLATFORM_INFO[platform].icon}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {PLATFORM_INFO[platform].label}
                  {getWarningCount(platform) > 0 && (
                    <Chip
                      size="small"
                      label={getWarningCount(platform)}
                      color={
                        preview?.platforms[platform].warnings.some(w => w.type === 'error')
                          ? 'error'
                          : 'warning'
                      }
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchPreview}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Preview Content */}
      {!loading && preview && (
        <>
          {/* Refresh Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              startIcon={<Refresh />}
              onClick={fetchPreview}
              disabled={loading}
              size="small"
            >
              Refresh Preview
            </Button>
          </Box>

          {/* Mobile Preview Frame */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            {renderPlatformPreview()}
          </Box>

          {/* Warnings Panel */}
          {preview.platforms[selectedPlatform].warnings.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter' }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Warning color="warning" />
                Issues Detected ({preview.platforms[selectedPlatform].warnings.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {preview.platforms[selectedPlatform].warnings.map((warning, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                  >
                    {getWarningIcon(warning.type)}
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {warning.message}
                    </Typography>
                    {warning.field && (
                      <Chip
                        size="small"
                        label={warning.field}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Raw Metadata Inspector */}
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowMetadata(!showMetadata)}
            >
              <Typography variant="subtitle2">Raw Metadata</Typography>
              <IconButton size="small">
                {showMetadata ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={showMetadata}>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: 400,
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(preview.metadata.raw, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </Paper>
        </>
      )}
    </Box>
  );
}
