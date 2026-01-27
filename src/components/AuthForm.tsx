'use client';

// ============================================================================
// URL Lens - Authentication Form Component
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import Link from 'next/link';
import type { AuthFormProps, LoginCredentials, SignupCredentials } from '@/types';

export default function AuthForm({
  mode,
  onSubmit,
  loading,
  error,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  const validateForm = (): boolean => {
    setValidationError(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (!password || password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }

    // Confirm password validation (signup only)
    if (isSignup && password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const credentials: LoginCredentials | SignupCredentials = isSignup
      ? { email, password, confirmPassword }
      : { email, password };

    await onSubmit(credentials);
  };

  const displayError = validationError || error;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isSignup
            ? 'Sign up to start analyzing URLs'
            : 'Sign in to your account'}
        </Typography>
      </Box>

      {displayError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {displayError}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
        autoComplete="email"
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
        autoComplete={isSignup ? 'new-password' : 'current-password'}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        helperText={isSignup ? 'Minimum 8 characters' : undefined}
      />

      {isSignup && (
        <TextField
          fullWidth
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
          autoComplete="new-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
          }}
        />
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ mt: 1, py: 1.5 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : isSignup ? (
          'Create Account'
        ) : (
          'Sign In'
        )}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <MuiLink
            component={Link}
            href={isSignup ? '/login' : '/signup'}
            underline="hover"
            fontWeight={600}
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </MuiLink>
        </Typography>
      </Box>
    </Box>
  );
}
