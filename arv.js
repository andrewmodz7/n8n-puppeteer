const puppeteer = require('puppeteer');

const address = process.argv[2];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.saleswise.app/cmas', { waitUntil: 'networkidle2', timeout: 0 });

    // Wait for input with longer timeout
    await page.waitForSelector('input[placeholder="Find a property"]', { timeout: 30000 });

    // Type the address
    await page.type('input[placeholder="Find a property"]', address);
    await page.keyboard.press('Enter');

    // Wait for the CMA PDF to be generated (or you can wait for download button to appear, etc.)
    await page.waitForTimeout(10000); // adjust this later to wait for actual element

    console.log(`✅ Finished processing CMA for: ${address}`);
  } catch (err) {
    console.error({ error: err.message });
  } finally {
    await browser.close();
  }
})();
