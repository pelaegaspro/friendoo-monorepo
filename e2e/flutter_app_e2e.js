const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runProductionAudit() {
  console.log('=== Production Friendoo Web E2E Audit with Playwright ===');
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const errors = [];
  const warnings = [];
  const networkErrors = [];

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    permissions: ['microphone']
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push(text);
      console.error(`🔴 CONSOLE ERROR: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
    } else {
      console.log(`ℹ️ [CONSOLE ${type.toUpperCase()}] ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[PAGE ERROR] ${err.message}`);
    console.error(`💥 PAGE ERROR: ${err.message}`);
  });

  page.on('requestfailed', req => {
    networkErrors.push(`${req.method()} ${req.url()} (${req.failure()?.errorText})`);
    console.warn(`⚠️ NETWORK FAILED: ${req.url()}`);
  });

  console.log('Navigating to http://localhost:5000...');
  const res = await page.goto('http://localhost:5000', { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`Loaded with HTTP status: ${res.status()}`);

  // Wait for Flutter canvas to render
  console.log('Waiting 6 seconds for Flutter engine & UI initialization...');
  await page.waitForTimeout(6000);

  // Take screenshot 1: Mobile UI
  const mobileScreenshot = path.join(__dirname, 'screenshots', 'prod_01_mobile_home.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: true });
  console.log(`📸 Saved screenshot: ${mobileScreenshot}`);

  // Test tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(2000);
  const tabletScreenshot = path.join(__dirname, 'screenshots', 'prod_02_tablet.png');
  await page.screenshot({ path: tabletScreenshot, fullPage: true });
  console.log(`📸 Saved screenshot: ${tabletScreenshot}`);

  // Test desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(2000);
  const desktopScreenshot = path.join(__dirname, 'screenshots', 'prod_03_desktop.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: true });
  console.log(`📸 Saved screenshot: ${desktopScreenshot}`);

  // Check DOM structure
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      canvasCount: document.querySelectorAll('canvas').length,
      flutterView: !!document.querySelector('flutter-view, flt-glass-pane'),
      bodyTextLength: document.body.innerText.trim().length,
      sampleBodyText: document.body.innerText.trim().slice(0, 300)
    };
  });

  console.log('\n--- Page Evaluation ---');
  console.log('Title:', pageInfo.title);
  console.log('Canvases:', pageInfo.canvasCount);
  console.log('Flutter View Present:', pageInfo.flutterView);
  console.log('Body Text Length:', pageInfo.bodyTextLength);

  await browser.close();

  const finalReport = {
    timestamp: new Date().toISOString(),
    status: errors.length === 0 ? 'HEALTHY' : 'ERRORS_DETECTED',
    pageInfo,
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    totalNetworkErrors: networkErrors.length,
    errors,
    warnings,
    networkErrors,
    screenshots: [
      mobileScreenshot,
      tabletScreenshot,
      desktopScreenshot
    ]
  };

  fs.writeFileSync(path.join(__dirname, 'prod_audit_report.json'), JSON.stringify(finalReport, null, 2));
  console.log('Saved final production audit report to e2e/prod_audit_report.json');

  return finalReport;
}

runProductionAudit().catch(err => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
