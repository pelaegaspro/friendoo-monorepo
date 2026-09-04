const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  
  page.on('console', msg => console.log('[PAGE CONSOLE]', msg.text()));
  page.on('response', res => {
    if (res.url().includes('supabase')) console.log('[API RESPONSE]', res.status(), res.url());
  });

  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.dispatchEvent('flt-semantics-placeholder', 'click');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const input = document.querySelector('input[type="tel"]');
    if (input) input.focus();
  });
  await page.waitForTimeout(300);
  await page.keyboard.type('9876543210', { delay: 40 });
  await page.waitForTimeout(500);

  // Click button directly
  const button = page.locator('flt-semantics[role="button"]');
  console.log('Button count:', await button.count());
  await button.click();
  console.log('Clicked button!');

  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'btn_clicked.png') });
  await browser.close();
}

run().catch(console.error);
