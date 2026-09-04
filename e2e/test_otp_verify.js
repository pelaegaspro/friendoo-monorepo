const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testOtpValidation() {
  console.log('=== Testing OTP Verification & Error Handling in Playwright ===');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.dispatchEvent('flt-semantics-placeholder', 'click');
  await page.waitForTimeout(1000);

  // Focus & type phone
  await page.evaluate(() => {
    const input = document.querySelector('input[type="tel"]');
    if (input) input.focus();
  });
  await page.waitForTimeout(300);
  await page.keyboard.type('9876543210', { delay: 40 });
  await page.waitForTimeout(500);

  // Click Send SMS Code
  await page.locator('flt-semantics[role="button"]').first().click();
  await page.waitForTimeout(3500);

  // Now on OTP screen. Focus the OTP input.
  console.log('Focusing OTP input...');
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    const otpInput = inputs[inputs.length - 1];
    if (otpInput) otpInput.focus();
  });
  await page.waitForTimeout(300);

  console.log('Typing wrong OTP 000000...');
  await page.keyboard.type('000000', { delay: 40 });
  await page.waitForTimeout(500);

  // Click "Verify & Enter Lounge" button
  console.log('Clicking Verify & Enter Lounge...');
  const buttons = page.locator('flt-semantics[role="button"]');
  const verifyBtn = buttons.last();
  await verifyBtn.click();

  // Wait 4 seconds for API response & UI error banner
  await page.waitForTimeout(4000);

  const otpResultShot = path.join(__dirname, 'screenshots', 'otp_invalid_error_handled.png');
  await page.screenshot({ path: otpResultShot });
  console.log(`📸 Saved: ${otpResultShot}`);

  await browser.close();

  console.log('Total console errors caught:', consoleErrors.length);
  fs.writeFileSync(path.join(__dirname, 'otp_test_report.json'), JSON.stringify({ consoleErrors }, null, 2));
}

testOtpValidation().catch(console.error);
