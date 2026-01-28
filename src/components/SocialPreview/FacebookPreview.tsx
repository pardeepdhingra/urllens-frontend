'use client';

// ============================================================================
// URL Lens - Facebook Preview Component
// Renders a mobile Facebook share preview mockup
// ============================================================================

import { Box, Typography, Avatar } from '@mui/material';
import { MoreHoriz, ThumbUp, ChatBubbleOutline, Reply } from '@mui/icons-material';
import MobileFrame from './MobileFrame';
import { SocialPlatformPreview } from '@/types';

interface FacebookPreviewProps {
  data: SocialPlatformPreview;
}

export default function FacebookPreview({ data }: FacebookPreviewProps) {
  return (
    <MobileFrame backgroundColor="#f0f2f5">
      <Box sx={{ p: 1.5 }}>
        {/* Post Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {/* Post Header */}
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#1877f2' }}>U</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                User Name
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                Just now · 🌐
              </Typography>
            </Box>
            <MoreHoriz sx={{ color: 'text.secondary' }} />
          </Box>

          {/* Post Text (optional) */}
          <Box sx={{ px: 1.5, pb: 1 }}>
            <Typography sx={{ fontSize: '0.85rem' }}>
              Check this out! 👇
            </Typography>
          </Box>

          {/* Link Preview Card */}
          <Box sx={{ mx: 1.5, mb: 1.5, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
            {/* Image */}
            {data.image ? (
              <Box
                sx={{
                  width: '100%',
                  height: 150,
                  bgcolor: '#e4e6eb',
                  backgroundImage: `url(${data.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 100,
                  bgcolor: '#e4e6eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  No image available
                </Typography>
              </Box>
            )}

            {/* Link Info */}
            <Box sx={{ p: 1.5, bgcolor: '#f0f2f5' }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  mb: 0.5,
                }}
              >
                {data.displayUrl}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {data.title || 'No title'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {data.description || 'No description'}
              </Typography>
            </Box>
          </Box>

          {/* Engagement Bar */}
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderTop: '1px solid #e4e6eb',
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <ThumbUp sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.75rem' }}>Like</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <ChatBubbleOutline sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.75rem' }}>Comment</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <Reply sx={{ fontSize: 18, transform: 'scaleX(-1)' }} />
              <Typography sx={{ fontSize: '0.75rem' }}>Share</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </MobileFrame>
  );
}
