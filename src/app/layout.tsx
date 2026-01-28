// ============================================================================
// URL Lens - Root Layout
// ============================================================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeRegistry } from '@/components';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const siteUrl = 'https://galasar.com';
const siteName = 'URL Lens';
const siteDescription =
  'The complete URL analysis platform. Analyze scrapability, SEO optimization, redirect chains, bot protections, and more. Get actionable insights with visual reports.';

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: 'URL Lens - The Complete URL Analysis Platform',
    template: '%s | URL Lens',
  },
  description: siteDescription,
  keywords: [
    'URL analyzer',
    'web scraping',
    'bot detection',
    'scrapability',
    'SEO analysis',
    'AEO optimization',
    'GEO optimization',
    'LLMO optimization',
    'redirect tracker',
    'UTM tracking',
    'robots.txt analyzer',
    'rate limit detection',
    'visual analysis',
    'screenshot crawler',
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,

  // Canonical URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: 'URL Lens - The Complete URL Analysis Platform',
    description: siteDescription,
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'URL Lens - The Complete URL Analysis Platform',
    description: siteDescription,
    creator: '@urllens',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Manifest
  manifest: '/manifest.json',

  // Verification (add your codes when you have them)
  // verification: {
  //   google: 'your-google-verification-code',
  //   yandex: 'your-yandex-verification-code',
  // },

  // Category
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e3a5f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'URL Lens',
  description: siteDescription,
  url: siteUrl,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'URL Scrapability Analysis',
    'Bot Protection Detection',
    'SEO/AEO/GEO/LLMO Analysis',
    'Visual Redirect Timeline',
    'UTM Parameter Tracking',
    'robots.txt Analysis',
    'Rate Limit Detection',
    'Shareable Reports',
  ],
  creator: {
    '@type': 'Organization',
    name: 'URL Lens',
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
