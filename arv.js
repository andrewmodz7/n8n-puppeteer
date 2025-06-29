const puppeteer = require('puppeteer');

(async () => {
  const address = process.argv[2];
  if (!address) {
    console.error('No address provided!');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Go to the site
    await page.goto('https://saleswise.ai/tools/arv-calculator', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // 2. Wait for and select the search input
    await page.waitForSelector('input[placeholder*="Find a property"]', {
      visible: true,
      timeout: 20000
    });

    // 3. Type in the address
    await page.type('input[placeholder*="Find a property"]', address, { delay: 50 });

    // 4. Press Enter to search
    await page.keyboard.press('Enter');

    // 5. Wait for the results to load (adjust if needed)
    await page.waitForTimeout(8000);

    // 6. Extract the ARV (edit selector if this changes)
    const arvSelector = 'div.flex.flex-col.gap-2.text-right.text-sm span.font-semibold';
    await page.waitForSelector(arvSelector, { timeout: 10000 });

    const arv = await page.$eval(arvSelector, el => el.textContent.trim());

    // 7. Output it
    console.log(JSON.stringify({ arv }));

  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
  } finally {
    await browser.close();
  }
})();
