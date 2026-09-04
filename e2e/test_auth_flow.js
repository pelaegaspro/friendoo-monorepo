const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAuthFlow() {
  console.log('=== Testing Auth Flow on Flutter Web with Playwright ===');
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox']
  });

  const errors = [];
  const logs = [];

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type().toUpperCase()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
      console.error(`🔴 CONSOLE ERROR: ${text}`);
    } else {
      console.log(`ℹ️ [CONSOLE] ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[UNCAUGHT] ${err.message}`);
    console.error(`💥 PAGE ERROR: ${err.message}`);
  });

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Click on the phone input area (centered around x: 230, y: 595 on 393x852)
  console.log('Clicking phone number field...');
  await page.mouse.click(230, 595);
  await page.waitForTimeout(1000);

  // Type phone number
  console.log('Typing phone number: 9876543210...');
  await page.keyboard.type('9876543210', { delay: 100 });
  await page.waitForTimeout(1000);

  const typedScreenshot = path.join(__dirname, 'screenshots', 'prod_04_phone_typed.png');
  await page.screenshot({ path: typedScreenshot });
  console.log(`📸 Saved typed screenshot: ${typedScreenshot}`);

  // Click "Send SMS Code" button (centered around x: 196, y: 685)
  console.log('Clicking Send SMS Code button...');
  await page.mouse.click(196, 685);

  // Wait 4 seconds for API request
  await page.waitForTimeout(4000);

  const afterSubmitScreenshot = path.join(__dirname, 'screenshots', 'prod_05_after_sms_submit.png');
  await page.screenshot({ path: afterSubmitScreenshot });
  console.log(`📸 Saved after submit screenshot: ${afterSubmitScreenshot}`);

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    errors,
    logs: logs.slice(-30),
    screenshots: [typedScreenshot, afterSubmitScreenshot]
  };

  fs.writeFileSync(path.join(__dirname, 'auth_flow_report.json'), JSON.stringify(report, null, 2));
  console.log('Finished auth flow test. Report saved.');
}

testAuthFlow().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
