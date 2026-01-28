// ============================================================================
// URL Lens - Social Media Preview Analyzer
// Extracts and analyzes metadata for social media preview rendering
// ============================================================================

import * as cheerio from 'cheerio';

// ============================================================================
// Types
// ============================================================================

export interface ImageMetadata {
  url: string;
  width?: number;
  height?: number;
  size_kb?: number;
  aspectRatio?: number;
}

export interface RawMetadata {
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;

  // Twitter Card
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;

  // Standard HTML
  title?: string;
  description?: string;
  canonical?: string;

  // All images found
  images: ImageMetadata[];
}

export interface PlatformWarning {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface PlatformPreview {
  title: string;
  description: string;
  image?: string;
  displayUrl?: string;
  warnings: PlatformWarning[];
}

export interface SocialPreviewResult {
  url: string;
  finalUrl: string;
  metadata: {
    title: string;
    description: string;
    canonical: string;
    images: ImageMetadata[];
    raw: RawMetadata;
  };
  platforms: {
    facebook: PlatformPreview;
    linkedin: PlatformPreview;
    google: PlatformPreview;
    twitter: PlatformPreview;
    whatsapp: PlatformPreview;
    telegram: PlatformPreview;
  };
  fetchedAt: string;
}

// ============================================================================
// Platform Configuration
// ============================================================================

const PLATFORM_RULES = {
  facebook: {
    titleMaxLength: 88,
    descriptionMaxLength: 200,
    imageWidth: 1200,
    imageHeight: 630,
    imageMinWidth: 600,
    aspectRatio: 1.91,
  },
  linkedin: {
    titleMaxLength: 70,
    descriptionMaxLength: 150,
    imageWidth: 1200,
    imageHeight: 627,
    aspectRatio: 1.91,
  },
  google: {
    titleMaxLength: 60,
    titleMinLength: 50,
    descriptionMaxLength: 160,
    descriptionMinLength: 150,
  },
  twitter: {
    titleMaxLength: 70,
    descriptionMaxLength: 200,
    imageWidth: 1200,
    imageHeight: 628,
    aspectRatio: 1.91,
  },
  whatsapp: {
    titleMaxLength: 65,
    descriptionMaxLength: 150,
    imageWidth: 300,
    imageHeight: 300,
  },
  telegram: {
    titleMaxLength: 80,
    descriptionMaxLength: 160,
    imageWidth: 800,
    imageHeight: 418,
  },
};

// ============================================================================
// HTML Fetching
// ============================================================================

const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_HTML_SIZE = 150 * 1024; // 150KB

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0; +https://urllens.com/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('Response is not HTML');
    }

    // Read only first 150KB
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Unable to read response body');
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (totalSize < MAX_HTML_SIZE) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      totalSize += value.length;
    }

    reader.cancel();

    const html = new TextDecoder().decode(
      new Uint8Array(chunks.reduce((acc, chunk) => {
        const combined = new Uint8Array(acc.length + chunk.length);
        combined.set(acc);
        combined.set(chunk, acc.length);
        return combined;
      }, new Uint8Array()))
    );

    return {
      html,
      finalUrl: response.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// Metadata Extraction
// ============================================================================

function extractMetadata(html: string, baseUrl: string): RawMetadata {
  const $ = cheerio.load(html);

  const getMetaContent = (selectors: string[]): string | undefined => {
    for (const selector of selectors) {
      const content = $(selector).attr('content');
      if (content?.trim()) return content.trim();
    }
    return undefined;
  };

  const normalizeUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  };

  // Extract Open Graph metadata
  const ogTitle = getMetaContent([
    'meta[property="og:title"]',
    'meta[name="og:title"]',
  ]);

  const ogDescription = getMetaContent([
    'meta[property="og:description"]',
    'meta[name="og:description"]',
  ]);

  const ogImage = normalizeUrl(getMetaContent([
    'meta[property="og:image"]',
    'meta[name="og:image"]',
    'meta[property="og:image:url"]',
  ]));

  const ogUrl = normalizeUrl(getMetaContent([
    'meta[property="og:url"]',
    'meta[name="og:url"]',
  ]));

  const ogType = getMetaContent([
    'meta[property="og:type"]',
    'meta[name="og:type"]',
  ]);

  const ogSiteName = getMetaContent([
    'meta[property="og:site_name"]',
    'meta[name="og:site_name"]',
  ]);

  // Extract Twitter Card metadata
  const twitterTitle = getMetaContent([
    'meta[name="twitter:title"]',
    'meta[property="twitter:title"]',
  ]);

  const twitterDescription = getMetaContent([
    'meta[name="twitter:description"]',
    'meta[property="twitter:description"]',
  ]);

  const twitterImage = normalizeUrl(getMetaContent([
    'meta[name="twitter:image"]',
    'meta[property="twitter:image"]',
    'meta[name="twitter:image:src"]',
  ]));

  const twitterCard = getMetaContent([
    'meta[name="twitter:card"]',
    'meta[property="twitter:card"]',
  ]);

  // Extract standard HTML metadata
  const title = $('title').text()?.trim() || undefined;

  const description = getMetaContent([
    'meta[name="description"]',
    'meta[property="description"]',
  ]);

  const canonical = normalizeUrl($('link[rel="canonical"]').attr('href') || undefined);

  // Collect all potential images
  const images: ImageMetadata[] = [];

  // Add OG and Twitter images first (highest priority)
  if (ogImage) {
    images.push({ url: ogImage });
  }
  if (twitterImage && twitterImage !== ogImage) {
    images.push({ url: twitterImage });
  }

  // Add additional OG images
  $('meta[property="og:image"]').each((index, img) => {
    if (index === 0) return; // Skip first, already added
    const url = normalizeUrl($(img).attr('content') || undefined);
    if (url && !images.some(i => i.url === url)) {
      images.push({ url });
    }
  });

  return {
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    ogSiteName,
    twitterTitle,
    twitterDescription,
    twitterImage,
    twitterCard,
    title,
    description,
    canonical,
    images,
  };
}

// ============================================================================
// Image Validation
// ============================================================================

async function validateImage(imageUrl: string): Promise<ImageMetadata | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLLens/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentLength = response.headers.get('content-length');
    const sizeKb = contentLength ? Math.round(parseInt(contentLength) / 1024) : undefined;

    return {
      url: imageUrl,
      size_kb: sizeKb,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Text Truncation
// ============================================================================

function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  // Try to truncate at word boundary
  const truncated = text.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

function formatDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let display = parsed.hostname.replace(/^www\./, '');

    if (parsed.pathname && parsed.pathname !== '/') {
      const path = parsed.pathname.replace(/\/$/, '');
      if (path.length > 30) {
        display += path.slice(0, 27) + '...';
      } else {
        display += path;
      }
    }

    return display;
  } catch {
    return url.slice(0, 50);
  }
}

// ============================================================================
// Platform-Specific Rendering
// ============================================================================

function generateFacebookPreview(metadata: RawMetadata, url: string): PlatformPreview {
  const rules = PLATFORM_RULES.facebook;
  const warnings: PlatformWarning[] = [];

  // Title priority: og:title → twitter:title → <title>
  const rawTitle = metadata.ogTitle || metadata.twitterTitle || metadata.title || '';
  const title = truncateText(rawTitle, rules.titleMaxLength);

  if (!metadata.ogTitle) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:title tag. Facebook may use page title instead.',
      field: 'title',
    });
  }

  if (rawTitle.length > rules.titleMaxLength) {
    warnings.push({
      type: 'info',
      message: `Title will be truncated from ${rawTitle.length} to ${rules.titleMaxLength} characters.`,
      field: 'title',
    });
  }

  // Description priority: og:description → twitter:description → meta description
  const rawDescription = metadata.ogDescription || metadata.twitterDescription || metadata.description || '';
  const description = truncateText(rawDescription, rules.descriptionMaxLength);

  if (!metadata.ogDescription) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:description tag.',
      field: 'description',
    });
  }

  if (rawDescription.length > rules.descriptionMaxLength) {
    warnings.push({
      type: 'info',
      message: `Description will be truncated from ${rawDescription.length} to ${rules.descriptionMaxLength} characters.`,
      field: 'description',
    });
  }

  // Image: og:image → twitter:image
  const image = metadata.ogImage || metadata.twitterImage;

  if (!image) {
    warnings.push({
      type: 'error',
      message: 'Missing og:image tag. Facebook will not display an image preview.',
      field: 'image',
    });
  }

  // URL display
  const displayUrl = formatDisplayUrl(metadata.ogUrl || url);

  return {
    title,
    description,
    image,
    displayUrl,
    warnings,
  };
}

function generateLinkedInPreview(metadata: RawMetadata, url: string): PlatformPreview {
  const rules = PLATFORM_RULES.linkedin;
  const warnings: PlatformWarning[] = [];

  // LinkedIn primarily uses OG tags, ignores Twitter tags
  const rawTitle = metadata.ogTitle || metadata.title || '';
  const title = truncateText(rawTitle, rules.titleMaxLength);

  if (!metadata.ogTitle) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:title tag. LinkedIn may use page title.',
      field: 'title',
    });
  }

  if (rawTitle.length > rules.titleMaxLength) {
    warnings.push({
      type: 'info',
      message: `Title will be truncated to ${rules.titleMaxLength} characters (LinkedIn is more aggressive).`,
      field: 'title',
    });
  }

  const rawDescription = metadata.ogDescription || metadata.description || '';
  const description = truncateText(rawDescription, rules.descriptionMaxLength);

  if (!metadata.ogDescription) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:description tag.',
      field: 'description',
    });
  }

  if (rawDescription.length > rules.descriptionMaxLength) {
    warnings.push({
      type: 'info',
      message: `Description will be truncated to ${rules.descriptionMaxLength} characters.`,
      field: 'description',
    });
  }

  const image = metadata.ogImage;

  if (!image) {
    warnings.push({
      type: 'error',
      message: 'Missing og:image tag. LinkedIn will not display an image preview.',
      field: 'image',
    });
  }

  const displayUrl = formatDisplayUrl(metadata.canonical || url);

  return {
    title,
    description,
    image,
    displayUrl,
    warnings,
  };
}

function generateGooglePreview(metadata: RawMetadata, url: string): PlatformPreview {
  const rules = PLATFORM_RULES.google;
  const warnings: PlatformWarning[] = [];

  // Google uses standard HTML tags, not OG tags for SERP
  const rawTitle = metadata.title || metadata.ogTitle || '';
  const title = truncateText(rawTitle, rules.titleMaxLength);

  if (!metadata.title) {
    warnings.push({
      type: 'warning',
      message: 'Missing <title> tag. Google may generate a title.',
      field: 'title',
    });
  }

  if (rawTitle.length > rules.titleMaxLength) {
    warnings.push({
      type: 'info',
      message: `Title exceeds ${rules.titleMaxLength} characters and may be truncated in search results.`,
      field: 'title',
    });
  } else if (rawTitle.length < rules.titleMinLength) {
    warnings.push({
      type: 'info',
      message: `Title is shorter than recommended (${rules.titleMinLength}-${rules.titleMaxLength} characters).`,
      field: 'title',
    });
  }

  const rawDescription = metadata.description || metadata.ogDescription || '';
  const description = truncateText(rawDescription, rules.descriptionMaxLength);

  if (!metadata.description) {
    warnings.push({
      type: 'warning',
      message: 'Missing meta description. Google may generate one from page content.',
      field: 'description',
    });
  }

  if (rawDescription.length > rules.descriptionMaxLength) {
    warnings.push({
      type: 'info',
      message: `Description exceeds ${rules.descriptionMaxLength} characters and may be truncated.`,
      field: 'description',
    });
  } else if (rawDescription.length < rules.descriptionMinLength && rawDescription.length > 0) {
    warnings.push({
      type: 'info',
      message: `Description is shorter than recommended (${rules.descriptionMinLength}-${rules.descriptionMaxLength} characters).`,
      field: 'description',
    });
  }

  const displayUrl = formatDisplayUrl(metadata.canonical || url);

  return {
    title,
    description,
    displayUrl,
    warnings,
  };
}

function generateTwitterPreview(metadata: RawMetadata, url: string): PlatformPreview {
  const rules = PLATFORM_RULES.twitter;
  const warnings: PlatformWarning[] = [];

  // Twitter priority: twitter:* → og:*
  const rawTitle = metadata.twitterTitle || metadata.ogTitle || metadata.title || '';
  const title = truncateText(rawTitle, rules.titleMaxLength);

  if (!metadata.twitterTitle && !metadata.ogTitle) {
    warnings.push({
      type: 'warning',
      message: 'Missing twitter:title and og:title tags.',
      field: 'title',
    });
  }

  if (rawTitle.length > rules.titleMaxLength) {
    warnings.push({
      type: 'info',
      message: `Title will be truncated to ${rules.titleMaxLength} characters.`,
      field: 'title',
    });
  }

  const rawDescription = metadata.twitterDescription || metadata.ogDescription || metadata.description || '';
  const description = truncateText(rawDescription, rules.descriptionMaxLength);

  if (!metadata.twitterDescription && !metadata.ogDescription) {
    warnings.push({
      type: 'warning',
      message: 'Missing twitter:description and og:description tags.',
      field: 'description',
    });
  }

  const image = metadata.twitterImage || metadata.ogImage;

  if (!image) {
    warnings.push({
      type: 'error',
      message: 'Missing twitter:image and og:image tags. No image preview will be shown.',
      field: 'image',
    });
  }

  if (!metadata.twitterCard) {
    warnings.push({
      type: 'warning',
      message: 'Missing twitter:card tag. Defaults to "summary".',
      field: 'card',
    });
  }

  const displayUrl = formatDisplayUrl(url);

  return {
    title,
    description,
    image,
    displayUrl,
    warnings,
  };
}

function generateWhatsAppPreview(metadata: RawMetadata, url: string): PlatformPreview {
  const rules = PLATFORM_RULES.whatsapp;
  const warnings: PlatformWarning[] = [];

  // WhatsApp uses OG tags
  const rawTitle = metadata.ogTitle || metadata.title || '';
  const title = truncateText(rawTitle, rules.titleMaxLength);

  if (!metadata.ogTitle) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:title tag.',
      field: 'title',
    });
  }

  const rawDescription = metadata.ogDescription || metadata.description || '';
  const description = truncateText(rawDescription, rules.descriptionMaxLength);

  if (!metadata.ogDescription) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:description tag.',
      field: 'description',
    });
  }

  const image = metadata.ogImage;

  if (!image) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:image tag. WhatsApp will not show a preview image.',
      field: 'image',
    });
  }

  const displayUrl = formatDisplayUrl(url);

  return {
    title,
    description,
    image,
    displayUrl,
    warnings,
  };
}

function generateTelegramPreview(metadata: RawMetadata, url: string): PlatformPreview {
  const rules = PLATFORM_RULES.telegram;
  const warnings: PlatformWarning[] = [];

  // Telegram uses OG tags, with special support for large images
  const rawTitle = metadata.ogTitle || metadata.title || '';
  const title = truncateText(rawTitle, rules.titleMaxLength);

  if (!metadata.ogTitle) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:title tag.',
      field: 'title',
    });
  }

  const rawDescription = metadata.ogDescription || metadata.description || '';
  const description = truncateText(rawDescription, rules.descriptionMaxLength);

  if (!metadata.ogDescription) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:description tag.',
      field: 'description',
    });
  }

  const image = metadata.ogImage;

  if (!image) {
    warnings.push({
      type: 'warning',
      message: 'Missing og:image tag. Telegram will not show a preview image.',
      field: 'image',
    });
  }

  const displayUrl = formatDisplayUrl(url);

  return {
    title,
    description,
    image,
    displayUrl,
    warnings,
  };
}

// ============================================================================
// Main Export
// ============================================================================

export async function analyzeSocialPreview(url: string): Promise<SocialPreviewResult> {
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Fetch HTML
  const { html, finalUrl } = await fetchHtml(normalizedUrl);

  // Extract metadata
  const rawMetadata = extractMetadata(html, finalUrl);

  // Validate images (only primary image to avoid too many requests)
  const validatedImages: ImageMetadata[] = [];
  for (const img of rawMetadata.images.slice(0, 3)) {
    const validated = await validateImage(img.url);
    if (validated) {
      validatedImages.push(validated);
    }
  }

  // Determine effective metadata
  const effectiveTitle = rawMetadata.ogTitle || rawMetadata.twitterTitle || rawMetadata.title || '';
  const effectiveDescription = rawMetadata.ogDescription || rawMetadata.twitterDescription || rawMetadata.description || '';
  const effectiveCanonical = rawMetadata.canonical || rawMetadata.ogUrl || finalUrl;

  // Generate platform previews
  const platforms = {
    facebook: generateFacebookPreview(rawMetadata, finalUrl),
    linkedin: generateLinkedInPreview(rawMetadata, finalUrl),
    google: generateGooglePreview(rawMetadata, finalUrl),
    twitter: generateTwitterPreview(rawMetadata, finalUrl),
    whatsapp: generateWhatsAppPreview(rawMetadata, finalUrl),
    telegram: generateTelegramPreview(rawMetadata, finalUrl),
  };

  return {
    url: normalizedUrl,
    finalUrl,
    metadata: {
      title: effectiveTitle,
      description: effectiveDescription,
      canonical: effectiveCanonical,
      images: validatedImages.length > 0 ? validatedImages : rawMetadata.images,
      raw: rawMetadata,
    },
    platforms,
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Export Types and Constants
// ============================================================================

export { PLATFORM_RULES };
