// ============================================================================
// URL Lens - FAQ Data
// Shared data for FAQ section and JSON-LD structured data
// ============================================================================

export const faqData = [
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
