// ============================================================================
// URL Lens - Root Layout
// ============================================================================

import type { Metadata, Viewport } from 'next';
import { ThemeRegistry } from '@/components';
import './globals.css';

const siteUrl = 'https://galasar.com';
const siteName = 'URL Lens';
// Keep under 160 characters for optimal SEO
const siteDescription =
  'Free URL analysis platform. Analyze scrapability, SEO, bot protection, redirects. 10,000+ URLs analyzed. Get instant insights.';

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

// Organization structured data
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: 'URL Lens',
  url: siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${siteUrl}/icon.svg`,
    width: 512,
    height: 512,
  },
  description: siteDescription,
  foundingDate: '2024',
  founder: {
    '@type': 'Person',
    '@id': `${siteUrl}/#founder`,
    name: 'Pardeep Dhingra',
  },
  sameAs: [
    'https://www.linkedin.com/in/pdhingra/',
    'https://medium.com/@pdhingra',
    'https://github.com/pardeepdhingra',
    'https://twitter.com/urllens',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'pardeep@galasar.com',
    contactType: 'customer support',
    availableLanguage: ['English'],
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AU',
    addressLocality: 'Sydney',
  },
};

// Person structured data for founder
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${siteUrl}/#founder`,
  name: 'Pardeep Dhingra',
  givenName: 'Pardeep',
  familyName: 'Dhingra',
  jobTitle: 'Founder & Developer',
  image: `${siteUrl}/pardeep.jpg`,
  email: 'pardeep@galasar.com',
  url: `${siteUrl}/about-pardeep`,
  worksFor: {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
  },
  sameAs: [
    'https://www.linkedin.com/in/pdhingra/',
    'https://medium.com/@pdhingra',
    'https://github.com/pardeepdhingra',
  ],
  knowsAbout: [
    'Web Scraping',
    'SEO Optimization',
    'Cloud Architecture',
    'Full-Stack Development',
    'AI/ML Applications',
    'URL Analysis',
    'Bot Detection',
  ],
  alumniOf: {
    '@type': 'Organization',
    name: 'Technology Industry',
  },
};

// WebApplication structured data
const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${siteUrl}/#webapp`,
  name: 'URL Lens',
  description: siteDescription,
  url: siteUrl,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
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
    '@id': `${siteUrl}/#organization`,
  },
  author: {
    '@type': 'Person',
    '@id': `${siteUrl}/#founder`,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
};

// WebPage structured data with Speakable
const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${siteUrl}/#webpage`,
  url: siteUrl,
  name: 'URL Lens - The Complete URL Analysis Platform',
  description: siteDescription,
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  inLanguage: 'en-US',
  isPartOf: {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'URL Lens',
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
    },
  },
  about: {
    '@type': 'Thing',
    name: 'URL Analysis and Web Scraping Tools',
  },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', 'h2', '.speakable'],
  },
  mainEntity: {
    '@type': 'WebApplication',
    '@id': `${siteUrl}/#webapp`,
  },
};

// BreadcrumbList schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Features',
      item: `${siteUrl}/features`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'About',
      item: `${siteUrl}/about-pardeep`,
    },
  ],
};

// WebSite schema with SearchAction
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  url: siteUrl,
  name: 'URL Lens',
  description: siteDescription,
  publisher: {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/dashboard?url={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

// Combined JSON-LD
const jsonLd = [organizationSchema, personSchema, webAppSchema, webPageSchema, breadcrumbSchema, webSiteSchema];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
