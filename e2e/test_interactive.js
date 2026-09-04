const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testInteractive() {
  console.log('=== Starting Interactive Playwright Test on Friendoo Web ===');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Enable accessibility layer
  await page.dispatchEvent('flt-semantics-placeholder', 'click');
  await page.waitForTimeout(1500);

  // Focus the input
  console.log('Focusing input...');
  await page.evaluate(() => {
    const input = document.querySelector('input[type="tel"]');
    if (input) {
      input.focus();
    }
  });
  await page.waitForTimeout(500);

  console.log('Typing 9876543210...');
  await page.keyboard.type('9876543210', { delay: 60 });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'typed_number_verified.png') });
  console.log('Saved typed_number_verified.png');

  // Submit via Enter or clicking button
  console.log('Pressing Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'post_submit_verified.png') });
  console.log('Saved post_submit_verified.png');

  await browser.close();
  console.log('Test completed successfully!');
}

testInteractive().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
