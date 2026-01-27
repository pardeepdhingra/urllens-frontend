const { chromium } = require('playwright');

async function testRedirectCapture(testUrl) {
  console.log('\n============================================================');
  console.log('Testing: ' + testUrl);
  console.log('============================================================');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const redirects = [];
  let step = 0;

  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 300 && status < 400) {
      step++;
      redirects.push({ step, url, status });
      console.log('  [Redirect ' + step + '] ' + status + ' -> ' + url);
    }
  });

  try {
    let normalizedUrl = testUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    console.log('\nStarting navigation to: ' + normalizedUrl);

    const response = await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    const finalStatus = response ? response.status() : 0;
    const title = await page.title();

    console.log('\n--- Final State ---');
    console.log('Final URL: ' + finalUrl);
    console.log('Final Status: ' + finalStatus);
    console.log('Page Title: ' + title);
    console.log('Total redirects: ' + redirects.length);

    const screenshot = await page.screenshot({ type: 'png' });
    console.log('Screenshot size: ' + screenshot.length + ' bytes');

  } catch (error) {
    console.error('Error: ' + error);
  } finally {
    await browser.close();
  }
}

async function main() {
  await testRedirectCapture('httpstat.us/301');
  await testRedirectCapture('httpstat.us/302'); 
  await testRedirectCapture('tinyurl.com');
}

main().catch(console.error);
