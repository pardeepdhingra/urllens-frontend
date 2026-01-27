// ============================================================================
// URL Lens - Root Layout
// ============================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeRegistry } from '@/components';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'URL Lens - URL Scrapability Analyzer',
  description:
    'Analyze any URL for scrapability. Detect bot protections, JavaScript requirements, and get scraping recommendations.',
  keywords: ['URL analyzer', 'web scraping', 'bot detection', 'scrapability'],
  authors: [{ name: 'URL Lens' }],
  openGraph: {
    title: 'URL Lens - URL Scrapability Analyzer',
    description: 'Analyze any URL for scrapability and get scraping recommendations.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
