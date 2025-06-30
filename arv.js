const puppeteer = require('puppeteer');

(async () => {
  const address = process.argv[2];

  if (!address) {
    console.error(JSON.stringify({ error: 'No address provided' }));
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.chatarv.ai/login', { waitUntil: 'networkidle2' });

    // Login
    await page.type('input[type="email"]', 'andrewmodz7@gmail.com');
    await page.type('input[type="password"]', 'Am120701*');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Go to the dashboard page
    await page.goto('https://www.chatarv.ai/dashboard/new', { waitUntil: 'networkidle2' });

    // Click and type in the address field
    await page.waitForSelector('input[placeholder*="Find"]');
    const input = await page.$('input[placeholder*="Find"]');
    await input.click();
    await input.type(address, { delay: 50 });

    // Wait for dropdown and click suggestion
    await new Promise(resolve => setTimeout(resolve, 1500));
    await page.waitForSelector('ul[role="listbox"] > li', { timeout: 8000 });
    await page.click('ul[role="listbox"] > li');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Click "Confirm"
    await page.waitForSelector('button', { timeout: 20000 });
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b =>
        b.innerText.toLowerCase().includes('confirm')
      );
      btn?.click();
    });

    // Click "Pick for me"
    await page.waitForSelector('button', { timeout: 20000 });
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b =>
        b.innerText.toLowerCase().includes('pick for me')
      );
      btn?.click();
    });

    // Get share link
    await page.waitForSelector('button', { timeout: 20000 });
    const shareLink = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b =>
        b.innerText.toLowerCase().includes('copy share link')
      );
      return btn?.getAttribute('data-clipboard-text') || null;
    });

    // Get ARV and details
    const dealData = await page.evaluate(() => {
      const summary = {};
      const blocks = Array.from(document.querySelectorAll('section, div')).map(el => el.innerText);
      for (const text of blocks) {
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

  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
  } finally {
    await browser.close();
  }
})();
