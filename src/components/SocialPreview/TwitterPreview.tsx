'use client';

// ============================================================================
// URL Lens - Twitter/X Preview Component
// Renders a mobile Twitter share preview mockup
// ============================================================================

import { Box, Typography, Avatar } from '@mui/material';
import { MoreHoriz, ChatBubbleOutline, Repeat, FavoriteBorder, IosShare, BarChart } from '@mui/icons-material';
import MobileFrame from './MobileFrame';
import { SocialPlatformPreview } from '@/types';

interface TwitterPreviewProps {
  data: SocialPlatformPreview;
}

export default function TwitterPreview({ data }: TwitterPreviewProps) {
  return (
    <MobileFrame backgroundColor="#000">
      <Box sx={{ p: 1.5 }}>
        {/* Tweet */}
        <Box
          sx={{
            borderBottom: '1px solid rgb(47, 51, 54)',
          }}
        >
          {/* Tweet Header */}
          <Box sx={{ display: 'flex', gap: 1.5, pb: 1 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#1d9bf0' }}>U</Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#e7e9ea' }}>
                  User Name
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#71767b' }}>
                  @username · 1m
                </Typography>
                <MoreHoriz sx={{ color: '#71767b', fontSize: 18, ml: 'auto' }} />
              </Box>

              {/* Tweet Text */}
              <Typography sx={{ fontSize: '0.9rem', color: '#e7e9ea', my: 1 }}>
                Just found this interesting! 🔥
              </Typography>

              {/* Link Preview Card */}
              <Box
                sx={{
                  border: '1px solid rgb(47, 51, 54)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  mb: 1.5,
                }}
              >
                {/* Image */}
                {data.image ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: 150,
                      bgcolor: '#2f3336',
                      backgroundImage: `url(${data.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 80,
                      bgcolor: '#2f3336',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#71767b', fontSize: '0.75rem' }}>
                      No image
                    </Typography>
                  </Box>
                )}

                {/* Link Info */}
                <Box sx={{ p: 1.5, bgcolor: '#000' }}>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#71767b',
                      mb: 0.25,
                    }}
                  >
                    {data.displayUrl}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      color: '#e7e9ea',
                      fontWeight: 400,
                      lineHeight: 1.3,
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
                      fontSize: '0.8rem',
                      color: '#71767b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mt: 0.5,
                    }}
                  >
                    {data.description || 'No description'}
                  </Typography>
                </Box>
              </Box>

              {/* Engagement */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  maxWidth: 280,
                  color: '#71767b',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ChatBubbleOutline sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>12</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Repeat sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>5</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FavoriteBorder sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>48</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BarChart sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.75rem' }}>1.2K</Typography>
                </Box>
                <IosShare sx={{ fontSize: 16 }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </MobileFrame>
  );
}
