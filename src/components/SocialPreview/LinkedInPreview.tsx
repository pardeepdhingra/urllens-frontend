'use client';

// ============================================================================
// URL Lens - LinkedIn Preview Component
// Renders a mobile LinkedIn share preview mockup
// ============================================================================

import { Box, Typography, Avatar } from '@mui/material';
import { MoreHoriz, ThumbUp, ChatBubbleOutline, Repeat, Send } from '@mui/icons-material';
import MobileFrame from './MobileFrame';
import { SocialPlatformPreview } from '@/types';

interface LinkedInPreviewProps {
  data: SocialPlatformPreview;
}

export default function LinkedInPreview({ data }: LinkedInPreviewProps) {
  return (
    <MobileFrame backgroundColor="#f3f2ef">
      <Box sx={{ p: 1.5 }}>
        {/* Post Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
          }}
        >
          {/* Post Header */}
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#0a66c2' }}>U</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#000' }}>
                User Name
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.6)' }}>
                Product Manager at Company
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.6)' }}>
                1m · 🌐
              </Typography>
            </Box>
            <MoreHoriz sx={{ color: 'rgba(0,0,0,0.6)' }} />
          </Box>

          {/* Post Text */}
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.9)' }}>
              Interesting article on this topic. Worth a read! 📖
            </Typography>
          </Box>

          {/* Link Preview Card */}
          <Box sx={{ border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {/* Image */}
            {data.image ? (
              <Box
                sx={{
                  width: '100%',
                  height: 150,
                  bgcolor: '#e8e8e8',
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
                  bgcolor: '#e8e8e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.75rem' }}>
                  No image available
                </Typography>
              </Box>
            )}

            {/* Link Info */}
            <Box sx={{ p: 1.5, bgcolor: '#f9fafb' }}>
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  mb: 0.5,
                  color: 'rgba(0,0,0,0.9)',
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
                  fontSize: '0.7rem',
                  color: 'rgba(0,0,0,0.6)',
                }}
              >
                {data.displayUrl}
              </Typography>
            </Box>
          </Box>

          {/* Engagement Stats */}
          <Box
            sx={{
              px: 1.5,
              py: 1,
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#0a66c2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThumbUp sx={{ fontSize: 10, color: 'white' }} />
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.6)' }}>
                42
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.6)' }}>
              3 comments · 2 reposts
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              px: 1,
              py: 0.5,
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, color: 'rgba(0,0,0,0.6)' }}>
              <ThumbUp sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Like</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, color: 'rgba(0,0,0,0.6)' }}>
              <ChatBubbleOutline sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Comment</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, color: 'rgba(0,0,0,0.6)' }}>
              <Repeat sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Repost</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, color: 'rgba(0,0,0,0.6)' }}>
              <Send sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Send</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </MobileFrame>
  );
}
