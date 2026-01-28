'use client';

// ============================================================================
// URL Lens - FAQ Section Component
// ============================================================================

import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const faqs = [
  {
    question: 'What is URL Lens?',
    answer: 'URL Lens is a comprehensive URL analysis platform that helps developers, SEO specialists, and marketers understand how web pages behave. It analyzes scrapability, bot protections, redirect chains, SEO optimization, and provides actionable insights with visual reports.',
  },
  {
    question: 'How does the scrapability score work?',
    answer: 'The scrapability score is a 0-100 rating that indicates how easy a URL is to scrape programmatically. It considers factors like bot protection measures (Cloudflare, reCAPTCHA, DataDome), rate limiting headers, robots.txt restrictions, and HTTP response characteristics.',
  },
  {
    question: 'What types of bot protection can URL Lens detect?',
    answer: 'URL Lens can detect various anti-bot measures including Cloudflare, reCAPTCHA, hCaptcha, DataDome, PerimeterX, Akamai Bot Manager, and other common protection systems. It also identifies rate limiting headers and JavaScript-based challenges.',
  },
  {
    question: 'What is SEO/AEO/GEO/LLMO analysis?',
    answer: 'URL Lens provides four types of optimization scores: SEO (Search Engine Optimization) for traditional search rankings, AEO (Answer Engine Optimization) for featured snippets and direct answers, GEO (Generative Engine Optimization) for AI-powered search results, and LLMO (Large Language Model Optimization) for AI chatbot visibility.',
  },
  {
    question: 'Can I track redirect chains with URL Lens?',
    answer: 'Yes! URL Lens provides a visual redirect timeline that shows each hop in a redirect chain, including screenshots at each step, HTTP status codes, response times, and how URL parameters change through the redirects. This is invaluable for debugging marketing attribution and SEO issues.',
  },
  {
    question: 'Is URL Lens free to use?',
    answer: 'URL Lens offers a free tier that allows you to analyze URLs and access basic features. Create a free account to start analyzing URLs, save your analysis history, and generate shareable reports for your team.',
  },
  {
    question: 'How can URL Lens help with web scraping projects?',
    answer: "URL Lens helps you understand the challenges you'll face before building a scraper. It identifies bot protections, rate limits, required headers, and provides recommendations for successful data extraction. This saves development time and helps you choose the right tools.",
  },
  {
    question: 'What information does URL Lens extract from URLs?',
    answer: 'URL Lens extracts comprehensive data including HTTP headers, response times, redirect chains, robots.txt rules, meta tags, structured data, bot protection indicators, rate limiting information, and visual screenshots of page states.',
  },
];

// Export FAQ data for JSON-LD structured data
export const faqData = faqs;

export default function FAQSection() {
  return (
    <Box sx={{ bgcolor: 'white', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Typography
          variant="h2"
          align="center"
          sx={{ mb: 2, fontWeight: 700 }}
        >
          Frequently Asked Questions
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Everything you need to know about URL Lens and how it can help your projects
        </Typography>

        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              sx={{
                mb: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: '0 0 16px 0',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  minHeight: 64,
                  '&.Mui-expanded': { minHeight: 64 },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
