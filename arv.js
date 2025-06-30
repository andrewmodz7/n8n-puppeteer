const puppeteer = require('puppeteer');

(async () => {
  const address = process.argv[2] || '';
  if (!address) {
    console.error(JSON.stringify({ error: 'No address provided' }));
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 0 // disables overall timeout (optional)
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000); // sets navigation timeout to 60s

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
    const postLoginHtml = await page.content();
    console.log('📝 FULL HTML after login:', postLoginHtml.substring(0, 2000));

    // Wait for the dashboard greeting to appear
    console.log('⏳ Waiting for dashboard greeting...');
    await page.waitForSelector('h1.text-3xl', { timeout: 30000 });
    console.log('✅ Dashboard greeting found!');
    const afterGreetingHtml = await page.content();
    console.log('📝 HTML after dashboard greeting:', afterGreetingHtml.substring(0, 2000));

    // Now wait for the search input with the correct placeholder
    console.log('⏳ Waiting for search input...');
    await page.waitForSelector('input[placeholder="Find a property"]', { timeout: 30000 });
    console.log('✅ Search input found!');
    const afterInputHtml = await page.content();
    console.log('📝 HTML after search input:', afterInputHtml.substring(0, 2000));

    const input = await page.$('input[placeholder="Find a property"]');
    await input.click();
    await input.type(address, { delay: 50 });
    await page.waitForTimeout(1500); // Give more time for dropdown to appear
    await page.waitForSelector('div.absolute.z-10 button', { visible: true, timeout: 10000 });
    const beforeDropdownHtml = await page.content();
    console.log('📝 HTML snippet before dropdown click:', beforeDropdownHtml.substring(0, 500));
    const firstOption = await page.$('div.absolute.z-10 button');
    await firstOption.click();
    const afterDropdownHtml = await page.content();
    console.log('📝 HTML snippet after dropdown click:', afterDropdownHtml.substring(0, 500));

    await page.waitForSelector('button', { timeout: 30000 });
    await page.evaluate(() => {
      const confirmBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('confirm')
      );
      confirmBtn?.click();
    });

    await page.waitForSelector('button', { timeout: 120000 });
    await page.evaluate(() => {
      const pickBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('pick for me')
      );
      pickBtn?.click();
    });

    await page.waitForSelector('button', { timeout: 30000 });
    const shareLink = await page.evaluate(() => {
      const copyBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.toLowerCase().includes('copy share link')
      );
      return copyBtn?.getAttribute('data-clipboard-text') || null;
    });

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
    const errorHtml = await page.content();
    console.error(JSON.stringify({
      error: err.message,
      url: page.url(),
      htmlSnippet: errorHtml.substring(0, 1000)
    }));
  } finally {
    await browser.close();
  }
})();
