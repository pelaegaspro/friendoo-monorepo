const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFullFlow() {
  console.log('=== Running Full Friendoo E2E Test Flow ===');
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox']
  });

  const errors = [];
  const networkLogs = [];

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(`[CONSOLE ERROR] ${text}`);
      console.error(`🔴 ${text}`);
    } else if (text.includes('auth') || text.includes('OTP') || text.includes('Supabase')) {
      console.log(`ℹ️ ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[PAGE CRASH] ${err.message}`);
    console.error(`💥 ${err.message}`);
  });

  page.on('response', res => {
    const url = res.url();
    if (url.includes('supabase') || url.includes('auth') || url.includes('functions')) {
      networkLogs.push(`${res.status()} ${res.request().method()} ${url}`);
      console.log(`🌐 API RESPONSE: ${res.status()} ${url}`);
    }
  });

  console.log('Loading Friendoo on http://localhost:5000...');
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  console.log('Enabling accessibility layer...');
  await page.dispatchEvent('flt-semantics-placeholder', 'click');
  await page.waitForTimeout(1500);

  const initialShot = path.join(__dirname, 'screenshots', 'flow_01_loaded.png');
  await page.screenshot({ path: initialShot });
  console.log(`📸 Saved initial screenshot: ${initialShot}`);

  const phoneInput = page.locator('input[aria-label="Mobile Phone Number"]');
  console.log('Filling phone number: 9876543210...');
  await phoneInput.fill('9876543210');
  await page.waitForTimeout(1000);

  const filledShot = path.join(__dirname, 'screenshots', 'flow_02_filled.png');
  await page.screenshot({ path: filledShot });
  console.log(`📸 Saved filled screenshot: ${filledShot}`);

  console.log('Clicking Send SMS Code button...');
  const sendButton = page.locator('flt-semantics[role="button"]').first();
  await sendButton.click();

  // Wait 5 seconds for network and UI transitions
  await page.waitForTimeout(5000);

  const postSubmitShot = path.join(__dirname, 'screenshots', 'flow_03_post_submit.png');
  await page.screenshot({ path: postSubmitShot });
  console.log(`📸 Saved post submit screenshot: ${postSubmitShot}`);

  await browser.close();

  const flowReport = {
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    errors,
    networkLogs,
    screenshots: [initialShot, filledShot, postSubmitShot]
  };

  fs.writeFileSync(path.join(__dirname, 'full_flow_report.json'), JSON.stringify(flowReport, null, 2));
  console.log('=== Test Completed Cleanly ===');
}

testFullFlow().catch(err => {
  console.error('Flow test error:', err);
  process.exit(1);
});
