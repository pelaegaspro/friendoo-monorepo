const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSubmit() {
  console.log('=== Clicking Send SMS Code Button ===');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  
  const networkLogs = [];
  const consoleLogs = [];

  page.on('console', msg => {
    const t = msg.text();
    consoleLogs.push(`[${msg.type()}] ${t}`);
    console.log(`ℹ️ [CONSOLE] ${t}`);
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('supabase') || url.includes('auth') || url.includes('functions')) {
      let body = '';
      try { body = await res.text(); } catch(e) {}
      networkLogs.push({ status: res.status(), url, body: body.slice(0, 300) });
      console.log(`🌐 API RESPONSE: ${res.status()} ${url} -> ${body.slice(0, 100)}`);
    }
  });

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Enable accessibility layer
  await page.dispatchEvent('flt-semantics-placeholder', 'click');
  await page.waitForTimeout(1000);

  // Focus input & type
  await page.evaluate(() => {
    const input = document.querySelector('input[type="tel"]');
    if (input) input.focus();
  });
  await page.waitForTimeout(500);
  await page.keyboard.type('9876543210', { delay: 40 });
  await page.waitForTimeout(1000);

  console.log('Clicking Send SMS Code button at (196, 682)...');
  await page.mouse.click(196, 682);

  // Wait 6 seconds for Supabase OTP API request
  await page.waitForTimeout(6000);

  const afterClickShot = path.join(__dirname, 'screenshots', 'post_sms_click_verified.png');
  await page.screenshot({ path: afterClickShot });
  console.log(`📸 Saved: ${afterClickShot}`);

  await browser.close();

  fs.writeFileSync(path.join(__dirname, 'sms_click_report.json'), JSON.stringify({ networkLogs, consoleLogs }, null, 2));
  console.log('Done!');
}

testSubmit().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
