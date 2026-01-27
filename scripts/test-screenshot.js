#!/usr/bin/env node
/**
 * URL Lens - Screenshot Test Script
 * Run this to test if Playwright screenshots are working correctly
 *
 * Usage: node scripts/test-screenshot.js [url]
 * Example: node scripts/test-screenshot.js https://example.com
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const testUrl = process.argv[2] || 'https://example.com';

async function testScreenshot() {
  console.log('='.repeat(60));
  console.log('URL Lens - Screenshot Test');
  console.log('='.repeat(60));
  console.log('');
  console.log('Testing URL:', testUrl);
  console.log('');

  let browser;

  try {
    // Check for system Chrome
    const chromePaths = {
      darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ],
      linux: [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ],
      win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      ],
    };

    let executablePath;
    const platform = process.platform;
    const paths = chromePaths[platform] || [];

    for (const p of paths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    console.log('Platform:', platform);
    console.log('Chrome executable:', executablePath || 'Using Playwright bundled Chromium');
    console.log('');

    // Launch browser
    console.log('[1/5] Launching browser...');
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,800',
        '--force-device-scale-factor=1',
      ],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await chromium.launch(launchOptions);
    console.log('   ✓ Browser launched');

    // Create page
    console.log('[2/5] Creating page...');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    console.log('   ✓ Page created');

    // Navigate
    console.log('[3/5] Navigating to URL...');
    const response = await page.goto(testUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('   ✓ Navigation complete');
    console.log('   Status:', response?.status());
    console.log('   Final URL:', page.url());

    // Wait for rendering
    console.log('[4/5] Waiting for page to render...');
    await page.waitForTimeout(2000);
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      console.log('   (Network idle timeout - continuing)');
    }
    const title = await page.title();
    console.log('   ✓ Page rendered');
    console.log('   Title:', title);

    // Take screenshot
    console.log('[5/5] Taking screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    console.log('   ✓ Screenshot captured');
    console.log('   Buffer size:', buffer.length, 'bytes');
    console.log('   Base64 length:', buffer.toString('base64').length, 'chars');

    // Validate PNG
    const pngSignature = buffer.slice(0, 8).toString('hex');
    const isValidPng = pngSignature === '89504e470d0a1a0a';
    console.log('   Valid PNG:', isValidPng ? 'Yes' : 'No');

    // Check if blank (very small file = likely blank)
    if (buffer.length < 5000) {
      console.log('   ⚠️  WARNING: Screenshot is very small, might be blank');
    } else {
      console.log('   ✓ Screenshot size looks good');
    }

    // Save to file for inspection
    const outputPath = path.join(__dirname, '..', 'test-screenshot.png');
    fs.writeFileSync(outputPath, buffer);
    console.log('');
    console.log('Screenshot saved to:', outputPath);

    await browser.close();

    console.log('');
    console.log('='.repeat(60));
    console.log('TEST PASSED ✓');
    console.log('='.repeat(60));
    console.log('');
    console.log('If the screenshot file is blank, try:');
    console.log('1. Run: npx playwright install chromium --with-deps');
    console.log('2. Check if the URL is accessible from your network');
    console.log('3. Try a different URL');

  } catch (err) {
    console.error('');
    console.error('='.repeat(60));
    console.error('TEST FAILED ✗');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Run: npx playwright install chromium --with-deps');
    console.error('2. Make sure Chrome/Chromium is installed');
    console.error('3. Check network connectivity to the URL');

    if (browser) await browser.close();
    process.exit(1);
  }
}

testScreenshot();
