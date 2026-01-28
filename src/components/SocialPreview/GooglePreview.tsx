'use client';

// ============================================================================
// URL Lens - Google Search Preview Component
// Renders a mobile Google SERP preview mockup
// ============================================================================

import { Box, Typography, InputBase } from '@mui/material';
import { Search, Mic, MoreVert } from '@mui/icons-material';
import MobileFrame from './MobileFrame';
import { SocialPlatformPreview } from '@/types';

interface GooglePreviewProps {
  data: SocialPlatformPreview;
}

export default function GooglePreview({ data }: GooglePreviewProps) {
  return (
    <MobileFrame backgroundColor="#fff">
      {/* Google Header */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e8e8e8' }}>
        {/* Search Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            bgcolor: '#f1f3f4',
            borderRadius: 4,
          }}
        >
          <Search sx={{ color: '#9aa0a6', fontSize: 20 }} />
          <InputBase
            value="search query"
            sx={{ flex: 1, fontSize: '0.85rem' }}
            readOnly
          />
          <Mic sx={{ color: '#4285f4', fontSize: 20 }} />
        </Box>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1.5, px: 0.5 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: '#1a73e8',
              fontWeight: 500,
              borderBottom: '3px solid #1a73e8',
              pb: 1,
            }}
          >
            All
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', pb: 1 }}>
            Images
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', pb: 1 }}>
            News
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', pb: 1 }}>
            Videos
          </Typography>
          <MoreVert sx={{ fontSize: 16, color: '#5f6368', ml: 'auto' }} />
        </Box>
      </Box>

      {/* Search Results */}
      <Box sx={{ p: 1.5 }}>
        {/* Results count */}
        <Typography sx={{ fontSize: '0.7rem', color: '#70757a', mb: 2 }}>
          About 1,234,567 results (0.42 seconds)
        </Typography>

        {/* First Result - Our Preview */}
        <Box sx={{ mb: 3 }}>
          {/* Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: '#e8e8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
              }}
            >
              🌐
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#202124' }}>
              {data.displayUrl}
            </Typography>
            <MoreVert sx={{ fontSize: 14, color: '#70757a', ml: 'auto' }} />
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontSize: '1rem',
              color: '#1a0dab',
              fontWeight: 400,
              lineHeight: 1.3,
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {data.title || 'No title'}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: '#4d5156',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.description || 'No description available'}
          </Typography>
        </Box>

        {/* Placeholder Results */}
        {[1, 2].map((i) => (
          <Box key={i} sx={{ mb: 3, opacity: 0.4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: '#e8e8e8',
                }}
              />
              <Box sx={{ width: '60%', height: 12, bgcolor: '#e8e8e8', borderRadius: 1 }} />
            </Box>
            <Box sx={{ width: '90%', height: 16, bgcolor: '#e8e8e8', borderRadius: 1, mb: 0.5 }} />
            <Box sx={{ width: '100%', height: 12, bgcolor: '#e8e8e8', borderRadius: 1, mb: 0.25 }} />
            <Box sx={{ width: '80%', height: 12, bgcolor: '#e8e8e8', borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    </MobileFrame>
  );
}
