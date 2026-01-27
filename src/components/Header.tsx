'use client';

// ============================================================================
// URL Lens - Header Component
// ============================================================================

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search,
  Person,
  Logout,
  Dashboard,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

interface HeaderProps {
  user?: { email: string } | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const getInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              URL Lens
            </Typography>
          </Box>
        </Link>

        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user ? (
            <>
              {!isMobile && (
                <Button
                  component={Link}
                  href="/dashboard"
                  startIcon={<Dashboard />}
                  color="inherit"
                >
                  Dashboard
                </Button>
              )}

              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {getInitial(user.email)}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: { minWidth: 200, mt: 1 },
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Signed in as
                  </Typography>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                {isMobile && (
                  <MenuItem
                    component={Link}
                    href="/dashboard"
                    onClick={handleMenuClose}
                  >
                    <Dashboard sx={{ mr: 1, fontSize: 20 }} />
                    Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Logout sx={{ mr: 1, fontSize: 20 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                component={Link}
                href="/login"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/signup"
                variant="contained"
                size={isMobile ? 'small' : 'medium'}
              >
                Get Started
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
