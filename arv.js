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

    console.log('🔒 Current URL after login:', page.url());
    await page.waitForSelector('body');

    // Type the address
    await page.waitForSelector('input[placeholder*="Find"]', { timeout: 15000 });
    const input = await page.$('input[placeholder*="Find"]');
    await input.type(address, { delay: 50 });

    // Wait and click the correct dropdown suggestion
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.waitForSelector('ul[role="listbox"] > li', { timeout: 5000 });
    const firstResult = await page.$('ul[role="listbox"] > li');
    if (firstResult) {
      await firstResult.click();
    } else {
      throw new Error("Address suggestion not found in dropdown");
    }

    // Wait for and click 'Confirm'
    await page.waitForSelector('button', { timeout: 30000 });
    await page.evaluate(() => {
      const confirmBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('confirm')
      );
      confirmBtn?.click();
    });

    // Wait for comps to load, then click 'Pick for me'
    await page.waitForSelector('button', { timeout: 120000 });
    await page.evaluate(() => {
      const pickBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('pick for me')
      );
      pickBtn?.click();
    });

    // Wait for Share Link button and grab it
    await page.waitForSelector('button', { timeout: 30000 });
    const shareLink = await page.evaluate(() => {
      const copyBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('copy share link')
      );
      return copyBtn?.getAttribute('data-clipboard-text') || null;
    });

    // Extract ARV and summary info
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
