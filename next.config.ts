import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Configure serverless function timeout (Vercel)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // External packages that should not be bundled
  serverExternalPackages: ['playwright'],
};

export default nextConfig;
