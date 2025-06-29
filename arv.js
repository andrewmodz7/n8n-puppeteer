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

    // Login
    await page.type('input[name="email"]', 'andrewmodz7@gmail.com');
    await page.type('input[name="password"]', 'Am120701*');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Address search
    await page.waitForSelector('input[placeholder="Find a property"]', { timeout: 15000 });
    await page.type('input[placeholder="Find a property"]', address);
    await page.waitForTimeout(2000); // Wait for suggestions
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Confirm comp criteria
    await page.waitForSelector('button', { timeout: 30000 });
    await page.evaluate(() => {
      [...document.querySelectorAll('button')].find(btn => btn.innerText.includes('Confirm')).click();
    });

    // Wait for comps to generate
    await page.waitForSelector('button', { timeout: 120000 });
    await page.evaluate(() => {
      [...document.querySelectorAll('button')].find(btn => btn.innerText.includes('Pick for me')).click();
    });

    // Wait for Share Link button and extract it
    await page.waitForSelector('button', { timeout: 30000 });
    const shareLink = await page.evaluate(() => {
      const copyBtn = [...document.querySelectorAll('button')].find(btn =>
        btn.innerText.includes('Copy Share Link') && btn.getAttribute('data-clipboard-text')
      );
      return copyBtn?.getAttribute('data-clipboard-text') || null;
    });

    if (!shareLink) {
      console.error(JSON.stringify({ error: 'Share link not found' }));
      process.exit(1);
    }

    console.log(JSON.stringify({ address, shareLink }));

  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
  } finally {
    await browser.close();
  }
})();
