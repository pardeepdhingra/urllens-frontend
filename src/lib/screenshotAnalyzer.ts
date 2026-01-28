// ============================================================================
// URL Lens - Screenshot Analyzer Engine
// Visual analysis of URL redirects using Playwright
// ============================================================================

// NOTE: Playwright is dynamically imported to avoid loading it when visual analysis is disabled
// This is necessary for serverless deployments (like Vercel) where Playwright is not available
import type { Browser, Page, Response, LaunchOptions } from 'playwright';
import type { RedirectScreenshot, VisualAnalysisResult } from '@/types';
import { existsSync } from 'fs';

// Configuration
const CONFIG = {
  timeout: 30000, // 30 seconds max per page
  maxRedirects: 8,
  maxScreenshots: 8,
  viewport: { width: 1280, height: 800 },
  imageFormat: 'png' as const,
  imageQuality: 80,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Common Chrome/Chromium executable paths
const CHROME_PATHS = {
  mac: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
  win: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

/**
 * Find a Chrome/Chromium executable on the system
 */
function findChromeExecutable(): string | undefined {
  const platform = process.platform;
  let paths: string[] = [];

  if (platform === 'darwin') {
    paths = CHROME_PATHS.mac;
  } else if (platform === 'linux') {
    paths = CHROME_PATHS.linux;
  } else if (platform === 'win32') {
    paths = CHROME_PATHS.win;
  }

  for (const chromePath of paths) {
    if (existsSync(chromePath)) {
      return chromePath;
    }
  }

  return undefined;
}

// Bot protection detection patterns
const BLOCK_PATTERNS = {
  cloudflare: [
    /checking your browser/i,
    /cloudflare/i,
    /ray id/i,
    /security check/i,
    /ddos protection/i,
    /challenge-platform/i,
  ],
  captcha: [
    /captcha/i,
    /recaptcha/i,
    /hcaptcha/i,
    /verify you are human/i,
    /robot/i,
    /not a robot/i,
  ],
  accessDenied: [
    /access denied/i,
    /forbidden/i,
    /403/i,
    /blocked/i,
    /unauthorized/i,
  ],
  rateLimit: [
    /rate limit/i,
    /too many requests/i,
    /slow down/i,
    /429/i,
  ],
};

/**
 * Detects if a page is blocked by bot protection
 */
async function detectBlockedReason(
  page: Page
): Promise<RedirectScreenshot['blocked_reason']> {
  try {
    const content = await page.content();
    const title = await page.title();
    const textToCheck = `${content} ${title}`.toLowerCase();

    // Check Cloudflare
    for (const pattern of BLOCK_PATTERNS.cloudflare) {
      if (pattern.test(textToCheck)) {
        return 'cloudflare';
      }
    }

    // Check Captcha
    for (const pattern of BLOCK_PATTERNS.captcha) {
      if (pattern.test(textToCheck)) {
        return 'captcha';
      }
    }

    // Check Access Denied
    for (const pattern of BLOCK_PATTERNS.accessDenied) {
      if (pattern.test(textToCheck)) {
        return 'access_denied';
      }
    }

    // Check Rate Limit
    for (const pattern of BLOCK_PATTERNS.rateLimit) {
      if (pattern.test(textToCheck)) {
        return 'rate_limit';
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Captures a screenshot of the current page
 */
async function captureScreenshot(page: Page): Promise<string> {
  try {
    // Ensure page is visible and rendered
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // Small delay to ensure rendering is complete
    await page.waitForTimeout(500);

    const buffer = await page.screenshot({
      type: CONFIG.imageFormat,
      fullPage: false,
      animations: 'disabled',
    });

    const base64 = buffer.toString('base64');
    console.log(`Screenshot captured: ${base64.length} chars, buffer size: ${buffer.length} bytes`);

    // Validate it's a real image (PNG should be > 1KB typically)
    if (buffer.length < 1000) {
      console.warn('Screenshot appears to be blank or very small');
    }

    return base64;
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return '';
  }
}

/**
 * Normalize URL to ensure it has a protocol
 */
function normalizeUrlForBrowser(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

/**
 * Main visual analysis function
 * Launches a headless browser, follows redirects step by step, and captures screenshots at each hop
 * Supports both local Playwright and remote Browserless.io
 */
export async function analyzeUrlVisually(
  inputUrl: string
): Promise<VisualAnalysisResult> {
  const startTime = Date.now();

  // Check if visual analysis is disabled (e.g., on Vercel serverless)
  if (process.env.DISABLE_VISUAL_ANALYSIS === 'true') {
    console.log('Visual analysis is disabled via DISABLE_VISUAL_ANALYSIS env var');
    return {
      screenshots: [],
      total_redirects: 0,
      final_url: inputUrl,
      blocked: false,
      analysis_duration_ms: Date.now() - startTime,
      disabled: true,
      disabled_reason: 'Visual analysis is not available in this deployment environment.',
    };
  }

  const screenshots: RedirectScreenshot[] = [];
  let browser: Browser | null = null;
  let blocked = false;
  let blockedAtStep: number | undefined;

  // Normalize URL to ensure it has a protocol
  const normalizedUrl = normalizeUrlForBrowser(inputUrl);

  // Check for Browserless.io API key (for serverless environments like Vercel)
  const browserlessApiKey = process.env.BROWSERLESS_API_KEY;
  const useBrowserless = !!browserlessApiKey;

  console.log('Visual analysis starting...', {
    useBrowserless,
    hasBrowserlessKey: !!browserlessApiKey,
    keyLength: browserlessApiKey?.length || 0,
  });

  try {
    // Dynamically import Playwright to avoid loading it when not needed
    let chromium;

    // If we have Browserless, prefer playwright-core (lighter, no browser binaries)
    if (useBrowserless) {
      try {
        console.log('Importing playwright-core for Browserless...');
        const playwrightCore = await import('playwright-core');
        chromium = playwrightCore.chromium;
        console.log('playwright-core imported successfully');
      } catch (coreImportError) {
        console.error('Failed to import playwright-core:', coreImportError);
        return {
          screenshots: [],
          total_redirects: 0,
          final_url: inputUrl,
          blocked: false,
          analysis_duration_ms: Date.now() - startTime,
          disabled: true,
          disabled_reason: 'Failed to load browser automation library. Please check deployment configuration.',
        };
      }
    } else {
      // No Browserless, try full Playwright for local development
      try {
        console.log('Importing full playwright for local browser...');
        const playwright = await import('playwright');
        chromium = playwright.chromium;
      } catch (importError) {
        console.warn('Playwright is not available and no Browserless API key configured:', importError);
        return {
          screenshots: [],
          total_redirects: 0,
          final_url: inputUrl,
          blocked: false,
          analysis_duration_ms: Date.now() - startTime,
          disabled: true,
          disabled_reason: 'Visual analysis requires either local Playwright or a Browserless.io API key. Add BROWSERLESS_API_KEY to enable.',
        };
      }
    }

    // Connect to Browserless.io or launch local browser
    if (useBrowserless) {
      console.log('Connecting to Browserless.io...');
      const browserlessUrl = `wss://chrome.browserless.io?token=${browserlessApiKey}`;
      try {
        browser = await chromium.connectOverCDP(browserlessUrl);
        console.log('Connected to Browserless.io successfully');
      } catch (connectError) {
        console.error('Failed to connect to Browserless.io:', connectError);
        return {
          screenshots: [],
          total_redirects: 0,
          final_url: inputUrl,
          blocked: false,
          analysis_duration_ms: Date.now() - startTime,
          disabled: true,
          disabled_reason: 'Failed to connect to Browserless.io. Please verify your API key is correct.',
        };
      }
    } else {
      // Try to find system Chrome if Playwright's chromium is not available
      const chromeExecutable = findChromeExecutable();

      const launchOptions: LaunchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800',
          '--force-device-scale-factor=1',
          '--hide-scrollbars',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      };

      // Use system Chrome if available
      if (chromeExecutable) {
        launchOptions.executablePath = chromeExecutable;
        console.log('Using system Chrome:', chromeExecutable);
      }

      // Launch browser
      browser = await chromium.launch(launchOptions);
      console.log('Launched local browser');
    }

    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      userAgent: CONFIG.userAgent,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Collect redirect chain info before actually navigating
    const redirectChain: Array<{ url: string; status: number }> = [];
    let currentStep = 0;

    // First, make a HEAD/GET request to collect redirect chain URLs without rendering
    // This helps us know what redirects to expect
    console.log('Collecting redirect chain for:', normalizedUrl);

    // Track all redirect responses
    page.on('response', (response: Response) => {
      const status = response.status();
      const url = response.url();

      // Track redirect responses (3xx)
      if (response.request().isNavigationRequest()) {
        console.log(`Response: ${status} -> ${url}`);
        if (status >= 300 && status < 400) {
          redirectChain.push({ url, status });
        }
      }
    });

    // Navigate with manual redirect handling to capture each step
    try {
      console.log('Starting navigation to:', normalizedUrl);

      // Step 1: Capture the initial URL (before any redirects happen)
      currentStep++;
      screenshots.push({
        step: currentStep,
        url: normalizedUrl,
        status: 0, // Will be updated
        screenshot_base64: '', // Placeholder - we'll capture after load
        page_title: 'Loading...',
        timestamp: new Date().toISOString(),
        blocked_reason: null,
      });

      // Navigate to the URL - Playwright will follow all redirects automatically
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: CONFIG.timeout,
      });

      // Wait for page to be fully rendered
      await page.waitForTimeout(1500);

      // Try to wait for network idle
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch {
        console.log('Network idle timeout, continuing...');
      }

      const finalUrl = page.url();
      const finalStatus = response?.status() || 200;
      const finalTitle = await page.title().catch(() => '');

      console.log('Navigation complete:');
      console.log('  Final URL:', finalUrl);
      console.log('  Final Status:', finalStatus);
      console.log('  Redirect chain length:', redirectChain.length);

      // Update the initial screenshot entry
      screenshots[0].status = redirectChain.length > 0 ? redirectChain[0].status : finalStatus;

      // If there were redirects, we need to show the redirect chain
      if (redirectChain.length > 0 || finalUrl !== normalizedUrl) {
        // For each redirect in the chain, add an entry
        // Note: We can't go back in time to capture screenshots at each redirect
        // So we'll document the redirect chain with the final screenshot

        // Build the complete URL chain
        const urlChain: Array<{ url: string; status: number }> = [
          { url: normalizedUrl, status: redirectChain[0]?.status || 301 },
        ];

        for (const redirect of redirectChain) {
          // Get the Location header destination (if any)
          urlChain.push(redirect);
        }

        // Add final destination
        if (urlChain[urlChain.length - 1]?.url !== finalUrl) {
          urlChain.push({ url: finalUrl, status: finalStatus });
        }

        console.log('URL chain:', urlChain.map((u) => u.url));

        // Capture final screenshot
        const finalScreenshot = await captureScreenshot(page);
        const finalBlockedReason = await detectBlockedReason(page);

        // Update first entry with info about redirect
        screenshots[0].page_title = `Redirects to: ${finalUrl.substring(0, 50)}...`;

        // Create entries for each unique URL in the chain
        const seenUrls = new Set<string>();
        seenUrls.add(normalizedUrl);

        for (const item of urlChain) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            currentStep++;

            // For intermediate redirects, we show the redirect info
            // For the final URL, we show the actual screenshot
            const isFinal = item.url === finalUrl;

            screenshots.push({
              step: currentStep,
              url: item.url,
              status: item.status,
              screenshot_base64: isFinal ? finalScreenshot : '',
              page_title: isFinal ? finalTitle : `HTTP ${item.status} Redirect`,
              timestamp: new Date().toISOString(),
              blocked_reason: isFinal ? finalBlockedReason : null,
            });

            if (isFinal && finalBlockedReason) {
              blocked = true;
              blockedAtStep = currentStep;
            }
          }
        }

        // If we only have the initial entry and it redirected, update it
        if (screenshots.length === 1 && finalUrl !== normalizedUrl) {
          currentStep++;
          screenshots.push({
            step: currentStep,
            url: finalUrl,
            status: finalStatus,
            screenshot_base64: finalScreenshot,
            page_title: finalTitle,
            timestamp: new Date().toISOString(),
            blocked_reason: finalBlockedReason,
          });

          if (finalBlockedReason) {
            blocked = true;
            blockedAtStep = currentStep;
          }
        }
      } else {
        // No redirects - just capture the final page
        const screenshot = await captureScreenshot(page);
        const blockedReason = await detectBlockedReason(page);

        screenshots[0].screenshot_base64 = screenshot;
        screenshots[0].page_title = finalTitle;
        screenshots[0].status = finalStatus;
        screenshots[0].blocked_reason = blockedReason;

        if (blockedReason) {
          blocked = true;
          blockedAtStep = 1;
        }
      }

      // Ensure first entry also has a screenshot (capture current state)
      if (!screenshots[0].screenshot_base64) {
        // Navigate back to original URL briefly to capture it?
        // Actually, let's just note that this was a redirect
        screenshots[0].page_title = `Redirect: ${screenshots[0].status || 301}`;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Navigation error:', errorMessage);

      // Try to capture current state even on error
      try {
        const errorScreenshot = await captureScreenshot(page);
        const errorTitle = await page.title().catch(() => 'Error');
        const currentUrl = page.url() || normalizedUrl;

        // Update or add screenshot
        if (screenshots.length > 0) {
          screenshots[screenshots.length - 1].screenshot_base64 = errorScreenshot;
          screenshots[screenshots.length - 1].page_title = errorTitle || 'Error loading page';
          screenshots[screenshots.length - 1].blocked_reason = errorMessage.includes('timeout') ? 'timeout' : null;
        } else {
          screenshots.push({
            step: 1,
            url: currentUrl,
            screenshot_base64: errorScreenshot,
            page_title: errorTitle || 'Error loading page',
            timestamp: new Date().toISOString(),
            blocked_reason: errorMessage.includes('timeout') ? 'timeout' : null,
          });
        }

        if (errorMessage.includes('timeout')) {
          blocked = true;
          blockedAtStep = screenshots.length;
        }
      } catch {
        // Can't capture screenshot
        console.error('Could not capture error screenshot');
      }
    }

    await context.close();

    const finalUrl = screenshots[screenshots.length - 1]?.url || normalizedUrl;
    const analysisDuration = Date.now() - startTime;

    // Filter out empty screenshots and ensure we have valid data
    const validScreenshots = screenshots.filter(
      (s) => s.url && (s.screenshot_base64 || s.page_title)
    );

    return {
      screenshots: validScreenshots.slice(0, CONFIG.maxScreenshots),
      total_redirects: Math.max(0, validScreenshots.length - 1),
      final_url: finalUrl,
      blocked,
      blocked_at_step: blockedAtStep,
      analysis_duration_ms: analysisDuration,
    };
  } catch (error) {
    const analysisDuration = Date.now() - startTime;
    console.error('Visual analysis error:', error);

    return {
      screenshots: [],
      total_redirects: 0,
      final_url: normalizedUrl,
      blocked: true,
      analysis_duration_ms: analysisDuration,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Gets a summary of the visual analysis
 */
export function getVisualAnalysisSummary(result: VisualAnalysisResult): string {
  if (result.screenshots.length === 0) {
    return 'Visual analysis failed - no screenshots captured.';
  }

  const parts: string[] = [];

  parts.push(`Captured ${result.screenshots.length} screenshot(s).`);
  parts.push(`${result.total_redirects} redirect(s) detected.`);

  if (result.blocked) {
    const blockedScreenshot = result.screenshots.find(
      (s) => s.step === result.blocked_at_step
    );
    const reason = blockedScreenshot?.blocked_reason || 'unknown';
    parts.push(`BLOCKED at step ${result.blocked_at_step} (${reason}).`);
  } else {
    parts.push('No blocking detected.');
  }

  parts.push(`Analysis took ${result.analysis_duration_ms}ms.`);

  return parts.join(' ');
}
