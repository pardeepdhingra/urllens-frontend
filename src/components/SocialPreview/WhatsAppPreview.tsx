'use client';

// ============================================================================
// URL Lens - WhatsApp Preview Component
// Renders a mobile WhatsApp share preview mockup
// ============================================================================

import { Box, Typography } from '@mui/material';
import { Done, DoneAll, ArrowBack, MoreVert, Call, Videocam } from '@mui/icons-material';
import MobileFrame from './MobileFrame';
import { SocialPlatformPreview } from '@/types';

interface WhatsAppPreviewProps {
  data: SocialPlatformPreview;
}

export default function WhatsAppPreview({ data }: WhatsAppPreviewProps) {
  return (
    <MobileFrame backgroundColor="#0b141a">
      {/* Chat Header */}
      <Box
        sx={{
          bgcolor: '#202c33',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ArrowBack sx={{ color: '#aebac1', fontSize: 22 }} />
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: '#6b7175',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cfd4d6',
            fontSize: '0.8rem',
          }}
        >
          👤
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#e9edef' }}>
            John Doe
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: '#8696a0' }}>
            online
          </Typography>
        </Box>
        <Videocam sx={{ color: '#aebac1', fontSize: 22 }} />
        <Call sx={{ color: '#aebac1', fontSize: 22 }} />
        <MoreVert sx={{ color: '#aebac1', fontSize: 22 }} />
      </Box>

      {/* Chat Background */}
      <Box
        sx={{
          flex: 1,
          p: 1.5,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          minHeight: 400,
        }}
      >
        {/* Date Bubble */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: '#182229',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', color: '#8696a0' }}>
              TODAY
            </Typography>
          </Box>
        </Box>

        {/* Message Bubble with Link Preview */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Box
            sx={{
              maxWidth: '85%',
              bgcolor: '#005c4b',
              borderRadius: 2,
              borderTopRightRadius: 0,
              overflow: 'hidden',
            }}
          >
            {/* Link Preview */}
            <Box sx={{ borderLeft: '4px solid #00a884' }}>
              {/* Image */}
              {data.image ? (
                <Box
                  sx={{
                    width: '100%',
                    height: 120,
                    bgcolor: '#1e3a3c',
                    backgroundImage: `url(${data.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : null}

              {/* Link Info */}
              <Box sx={{ p: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#e9edef',
                    lineHeight: 1.3,
                    mb: 0.25,
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
                    color: '#8696a0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 0.5,
                  }}
                >
                  {data.description || 'No description'}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#8696a0' }}>
                  🔗 {data.displayUrl}
                </Typography>
              </Box>
            </Box>

            {/* Message */}
            <Box sx={{ p: 1, pt: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#e9edef' }}>
                Check this out! 👆
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#8696a0' }}>
                  10:42 AM
                </Typography>
                <DoneAll sx={{ fontSize: 14, color: '#53bdeb' }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Incoming message */}
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Box
            sx={{
              maxWidth: '70%',
              bgcolor: '#202c33',
              borderRadius: 2,
              borderTopLeftRadius: 0,
              p: 1,
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: '#e9edef' }}>
              Looks interesting! 👀
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#8696a0' }}>
                10:43 AM
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </MobileFrame>
  );
}
