const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/bin/chromium', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved');
})().catch(e => console.error(e));
