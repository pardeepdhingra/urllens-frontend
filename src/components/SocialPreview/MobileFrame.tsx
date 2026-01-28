'use client';

// ============================================================================
// URL Lens - Mobile Phone Frame Component
// Renders content inside a mobile phone mockup
// ============================================================================

import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
  backgroundColor?: string;
}

export default function MobileFrame({ children, backgroundColor = '#f5f5f5' }: MobileFrameProps) {
  return (
    <Box
      sx={{
        // Phone body
        width: 320,
        height: 640,
        bgcolor: '#1a1a1a',
        borderRadius: '36px',
        padding: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',

        // Side buttons
        '&::before': {
          content: '""',
          position: 'absolute',
          right: -3,
          top: 100,
          width: 3,
          height: 30,
          bgcolor: '#333',
          borderRadius: '0 2px 2px 0',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          right: -3,
          top: 150,
          width: 3,
          height: 60,
          bgcolor: '#333',
          borderRadius: '0 2px 2px 0',
        },
      }}
    >
      {/* Screen */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: backgroundColor,
          borderRadius: '28px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 28,
            bgcolor: '#1a1a1a',
            borderRadius: '0 0 16px 16px',
            zIndex: 10,
          }}
        />

        {/* Status Bar */}
        <Box
          sx={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 1,
          }}
        >
          <Box sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#333' }}>
            9:41
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 10, bgcolor: '#333', borderRadius: 0.5 }} />
            <Box sx={{ width: 16, height: 10, bgcolor: '#333', borderRadius: 0.5 }} />
            <Box sx={{ width: 20, height: 10, bgcolor: '#333', borderRadius: 1 }} />
          </Box>
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            height: 'calc(100% - 44px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
