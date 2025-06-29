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

    await page.type('input[type="email"]', process.env.CHATARV_EMAIL);
    await page.type('input[type="password"]', process.env.CHATARV_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const currentUrl = page.url();
    console.log(JSON.stringify({ stdout: `🔒 Current URL after login: ${currentUrl}` }));

    await page.goto('https://www.chatarv.ai/dashboard/new', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[placeholder*="Find"]');
    const input = await page.$('input[placeholder*="Find"]');

    await input.click(); // ✅ Ensure input is focused to trigger dropdown behavior
    await input.type(address, { delay: 50 });

    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for dropdown to appear

    await page.waitForSelector('ul[role="listbox"] > li', { timeout: 8000 });
    await page.click('ul[role="listbox"] > li');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const finalUrl = page.url();
    const propertyData = {
      stdout: finalUrl,
    };

    console.log(JSON.stringify(propertyData));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
  } finally {
    await browser.close();
  }
})();
