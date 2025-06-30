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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
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

    // Add extra wait after login to allow SPA to render
    await new Promise(resolve => setTimeout(resolve, 5000));

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
    await input.click({ clickCount: 3 });
    await input.press('Backspace');
    await input.type(address, { delay: 50 });
    // Wait longer for dropdown to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Log HTML after typing
    const afterTypeHtml = await page.content();
    console.log('📝 HTML after typing address:', afterTypeHtml.substring(0, 2000));
    // Try a more flexible selector for the dropdown button
    await page.waitForSelector('button', { visible: true, timeout: 15000 });
    const dropdownButtons = await page.$$('button');
    let firstOption = null;
    for (const btn of dropdownButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text && text.toLowerCase().includes(address.split(',')[0].toLowerCase())) {
        firstOption = btn;
        break;
      }
    }
    if (firstOption) {
      await firstOption.click();
      console.log('✅ Dropdown option clicked!');
    } else {
      console.error('❌ Dropdown option not found!');
    }

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

    // Wait for the report to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract the Estimated ARV value using precise HTML structure
    const estimatedARV = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      for (const h3 of h3s) {
        if (h3.innerText.trim() === 'Estimated ARV') {
          const p = h3.nextElementSibling;
          if (p && p.tagName === 'P') {
            return p.innerText.trim();
          }
        }
      }
      return null;
    });

    if (!estimatedARV) {
      console.error(JSON.stringify({ error: 'Estimated ARV not found' }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      address,
      estimatedARV
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
