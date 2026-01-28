'use client';

// ============================================================================
// URL Lens - Telegram Preview Component
// Renders a mobile Telegram share preview mockup
// ============================================================================

import { Box, Typography } from '@mui/material';
import { ArrowBack, MoreVert, Call, Search, Done, DoneAll } from '@mui/icons-material';
import MobileFrame from './MobileFrame';
import { SocialPlatformPreview } from '@/types';

interface TelegramPreviewProps {
  data: SocialPlatformPreview;
}

export default function TelegramPreview({ data }: TelegramPreviewProps) {
  return (
    <MobileFrame backgroundColor="#0e1621">
      {/* Chat Header */}
      <Box
        sx={{
          bgcolor: '#17212b',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ArrowBack sx={{ color: '#6ab3f3', fontSize: 22 }} />
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: '#5288c1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          JD
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff' }}>
            Jane Doe
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: '#6ab3f3' }}>
            online
          </Typography>
        </Box>
        <Call sx={{ color: '#6ab3f3', fontSize: 22 }} />
        <Search sx={{ color: '#6ab3f3', fontSize: 22 }} />
        <MoreVert sx={{ color: '#6ab3f3', fontSize: 22 }} />
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          p: 1.5,
          minHeight: 400,
          bgcolor: '#0e1621',
        }}
      >
        {/* Date Bubble */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.3)',
              px: 1.5,
              py: 0.5,
              borderRadius: 3,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: '#fff' }}>
              Today
            </Typography>
          </Box>
        </Box>

        {/* Outgoing Message with Link */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Box
            sx={{
              maxWidth: '85%',
              bgcolor: '#2b5278',
              borderRadius: 2,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
            }}
          >
            {/* Link Preview */}
            {data.image && (
              <Box
                sx={{
                  width: '100%',
                  height: 140,
                  backgroundImage: `url(${data.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            <Box sx={{ p: 1 }}>
              {/* Site name */}
              <Typography sx={{ fontSize: '0.7rem', color: '#6ab3f3', fontWeight: 500, mb: 0.25 }}>
                {data.displayUrl?.split('/')[0] || 'Website'}
              </Typography>

              {/* Title */}
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#fff',
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

              {/* Description */}
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {data.description || 'No description'}
              </Typography>
            </Box>

            {/* Message text */}
            <Box sx={{ px: 1, pb: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#fff' }}>
                Found this interesting article 📖
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                  14:32
                </Typography>
                <DoneAll sx={{ fontSize: 14, color: '#4caf50' }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Incoming Message */}
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Box
            sx={{
              maxWidth: '70%',
              bgcolor: '#182533',
              borderRadius: 2,
              borderBottomLeftRadius: 0,
              p: 1,
            }}
          >
            <Typography sx={{ fontSize: '0.9rem', color: '#fff' }}>
              Nice find! Thanks for sharing 🙏
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                14:33
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </MobileFrame>
  );
}
