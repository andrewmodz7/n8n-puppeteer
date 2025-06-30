const puppeteer = require('puppeteer');

(async () => {
  const address = process.argv[2] || '';
  if (!address) {
    console.error(JSON.stringify({ error: 'No address provided' }));
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.chatarv.ai/dashboard/new', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Login
    await page.type('input[name="email"]', 'andrewmodz7@gmail.com');
    await page.type('input[name="password"]', 'Am120701*');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Log current URL + screenshot to verify login worked
    console.log('🔒 Current URL after login:', page.url());
    await page.screenshot({ path: 'post-login-debug.png' });

    // Wait for address input to confirm dashboard loaded
    await page.waitForSelector('input[placeholder*="Find"]', { timeout: 15000 });
    const input = await page.$('input[placeholder*="Find"]');

    // ✅ FOCUS + TYPE (corrected)
    await input.click(); // focus the field
    await input.type(address, { delay: 50 }); // type address slowly
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for dropdown

    // ✅ SELECT FROM DROPDOWN
    await page.waitForSelector('ul[role="listbox"] > li', { timeout: 8000 });
    const firstOption = await page.$('ul[role="listbox"] > li');
    await firstOption.click();

    // Wait for 'Confirm' button and click it
    await page.waitForSelector('button', { timeout: 30000 });
    await page.evaluate(() => {
      const confirmBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('confirm')
      );
      confirmBtn?.click();
    });

    // Wait for comps and click 'Pick for me'
    await page.waitForSelector('button', { timeout: 120000 });
    await page.evaluate(() => {
      const pickBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('pick for me')
      );
      pickBtn?.click();
    });

    // Copy Share Link
    await page.waitForSelector('button', { timeout: 30000 });
    const shareLink = await page.evaluate(() => {
      const copyBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('copy share link')
      );
      return copyBtn?.getAttribute('data-clipboard-text') || null;
    });

    // Extract ARV + summary
    const dealData = await page.evaluate(() => {
      const summary = {};
      const textBlocks = Array.from(document.querySelectorAll('section, div')).map(el => el.innerText);
      for (const text of textBlocks) {
        if (!summary.arv && /\$[\d,.]+/.test(text) && /arv/i.test(text)) {
          summary.arv = text;
        }
        if (!summary.details && /bed/i.test(text) && /bath/i.test(text)) {
          summary.details = text;
        }
      }
      return summary;
    });

    if (!shareLink) {
      console.error(JSON.stringify({ error: 'Share link not found' }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      address,
      shareLink,
      arv: dealData.arv || null,
      details: dealData.details || null
    }));

  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
  } finally {
    await browser.close();
  }
})();
