// ============================================================================
// URL Lens - HTML Analyzer for SEO
// Parses HTML content and extracts SEO-relevant data
// ============================================================================

import * as cheerio from 'cheerio';
import type { HTMLAnalysisData } from '@/types/seo';

/**
 * Analyze HTML content for SEO-relevant data
 */
export function analyzeHTML(html: string, url: string): HTMLAnalysisData {
  const $ = cheerio.load(html);

  // Meta tags
  const title = $('title').first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const viewport = $('meta[name="viewport"]').attr('content') || null;
  const robots = $('meta[name="robots"]').attr('content') || null;
  const language = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content') || null;

  // Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription = $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  const ogType = $('meta[property="og:type"]').attr('content') || null;
  const ogUrl = $('meta[property="og:url"]').attr('content') || null;

  // Twitter Card tags
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || null;
  const twitterTitle = $('meta[name="twitter:title"]').attr('content') || null;
  const twitterDescription = $('meta[name="twitter:description"]').attr('content') || null;
  const twitterImage = $('meta[name="twitter:image"]').attr('content') || null;

  // Heading structure
  const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2Tags = $('h2').map((_, el) => $(el).text().trim()).get();
  const h3Tags = $('h3').map((_, el) => $(el).text().trim()).get();
  const h4Tags = $('h4').map((_, el) => $(el).text().trim()).get();

  // Content metrics
  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(p => p.length > 0);
  const paragraphCount = paragraphs.length;
  const totalParagraphWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
  const avgParagraphLength = paragraphCount > 0 ? Math.round(totalParagraphWords / paragraphCount) : 0;

  // Word count (approximate - from visible text)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  // Image analysis
  const images = $('img');
  const totalImages = images.length;
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;

  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt && alt.trim().length > 0) {
      imagesWithAlt++;
    } else {
      imagesWithoutAlt++;
    }
  });

  // Link analysis
  const links = $('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    links.each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          if (href.startsWith('/') || href.startsWith('#')) {
            internalLinks++;
          } else if (href.startsWith('http')) {
            const linkUrl = new URL(href);
            if (linkUrl.hostname === domain || linkUrl.hostname.endsWith('.' + domain)) {
              internalLinks++;
            } else {
              externalLinks++;
            }
          } else {
            internalLinks++;
          }
        } catch {
          internalLinks++;
        }
      }
    });
  } catch {
    // If URL parsing fails, count all as internal
    internalLinks = links.length;
  }

  // Lists and tables
  const hasOrderedLists = $('ol').length > 0;
  const hasUnorderedLists = $('ul').length > 0;
  const hasDefinitionLists = $('dl').length > 0;
  const hasTables = $('table').length > 0;
  const tableCount = $('table').length;

  // Semantic HTML elements
  const hasArticleTag = $('article').length > 0;
  const hasSectionTags = $('section').length > 0;
  const hasMainTag = $('main').length > 0;
  const hasNavTag = $('nav').length > 0;
  const hasHeaderTag = $('header').length > 0;
  const hasFooterTag = $('footer').length > 0;
  const hasAsideTag = $('aside').length > 0;

  // Security
  const isHttps = url.startsWith('https://');

  return {
    // Meta tags
    title,
    titleLength: title?.length || 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length || 0,
    canonical,
    viewport,
    robots,
    language,

    // Open Graph
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    ogUrl,

    // Twitter Cards
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,

    // Content structure
    h1Tags,
    h2Tags,
    h3Tags,
    h4Tags,
    paragraphCount,
    avgParagraphLength,
    wordCount,

    // Images
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt,

    // Links
    internalLinks,
    externalLinks,

    // Lists & Tables
    hasOrderedLists,
    hasUnorderedLists,
    hasDefinitionLists,
    hasTables,
    tableCount,

    // Semantic HTML
    hasArticleTag,
    hasSectionTags,
    hasMainTag,
    hasNavTag,
    hasHeaderTag,
    hasFooterTag,
    hasAsideTag,

    // Security
    isHttps,
  };
}
