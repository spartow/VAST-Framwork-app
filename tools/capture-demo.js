/**
 * VAST Framework Demo Capture Script
 * Captures screenshots of each tab and assembles walkthrough
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'demo-screenshots');
const DELAY = 1500; // ms between actions

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture(page, name, stepNum) {
  const filename = `${String(stepNum).padStart(2, '0')}_${name}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  [${stepNum}] Captured: ${filename}`);
  return filepath;
}

async function main() {
  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const screenshots = [];
  let step = 1;

  try {
    // 1. Home page
    console.log('\n--- MAIN APP FLOW ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    screenshots.push(await capture(page, 'home', step++));

    // 2. Click Scenarios tab and scroll to see scenarios
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[0].click(); // Scenarios
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 200));
    await delay(500);
    screenshots.push(await capture(page, 'scenarios', step++));

    // 3. Load Healthcare scenario
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const loadBtn = Array.from(btns).find(b => b.textContent.includes('Load Scenario'));
      if (loadBtn) loadBtn.click();
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'scenario_loaded', step++));

    // 4. Beliefs tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[1].click(); // Beliefs
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 200));
    await delay(500);
    screenshots.push(await capture(page, 'beliefs', step++));

    // Scroll down to see belief details
    await page.evaluate(() => window.scrollTo(0, 500));
    await delay(500);
    screenshots.push(await capture(page, 'beliefs_detail', step++));

    // 5. Make Decision tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[2].click(); // Make Decision
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'decision', step++));

    // Click Make Decision button if available
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const decBtn = Array.from(btns).find(b =>
        b.textContent.includes('Make Decision') && !b.textContent.includes('⚡')
      );
      if (decBtn) decBtn.click();
    });
    await delay(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'decision_result', step++));

    // Scroll to see utilities
    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(500);
    screenshots.push(await capture(page, 'decision_utilities', step++));

    // 6. Gauges tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[3].click(); // Gauges
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'gauges', step++));

    // Scroll to see all gauges
    await page.evaluate(() => window.scrollTo(0, 300));
    await delay(500);
    screenshots.push(await capture(page, 'gauges_detail', step++));

    // 7. Audit Trail tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[4].click(); // Audit Trail
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'audit_trail', step++));

    // 8. Blockchain tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[5].click(); // Blockchain
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'blockchain', step++));

    // Scroll to see more blockchain info
    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(500);
    screenshots.push(await capture(page, 'blockchain_detail', step++));

    // 9. Rules tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[6].click(); // Rules
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'rules', step++));

    // 10. Evidence tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[7].click(); // Evidence
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'evidence', step++));

    // 11. Compare tab
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav button');
      btns[8].click(); // Compare
    });
    await delay(DELAY);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    screenshots.push(await capture(page, 'compare', step++));

    // Scroll to see charts
    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(500);
    screenshots.push(await capture(page, 'compare_charts', step++));

    // --- PRESENTATION MODE ---
    console.log('\n--- PRESENTATION MODE ---');

    // Click Present button
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const presentBtn = Array.from(btns).find(b => b.textContent.includes('Present'));
      if (presentBtn) presentBtn.click();
    });
    await delay(2000);

    // Capture all 9 presentation slides
    const slideNames = ['title', 'framework', 'scenario', 'beliefs', 'decision', 'gauges', 'blockchain', 'integrity', 'comparison'];

    for (let i = 0; i < slideNames.length; i++) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await delay(800);
      screenshots.push(await capture(page, `present_${slideNames[i]}`, step++));

      // Also capture scrolled view for longer slides
      if (['framework', 'blockchain', 'integrity', 'comparison'].includes(slideNames[i])) {
        await page.evaluate(() => window.scrollTo(0, 500));
        await delay(500);
        screenshots.push(await capture(page, `present_${slideNames[i]}_scroll`, step++));
      }

      // Navigate to next slide (except last)
      if (i < slideNames.length - 1) {
        await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          const nextBtn = Array.from(btns).find(b => b.textContent.includes('Next'));
          if (nextBtn) nextBtn.click();
        });
        await delay(800);
      }
    }

    console.log(`\n✅ Captured ${screenshots.length} screenshots in ${OUTPUT_DIR}`);
    console.log('Screenshots:', screenshots.map(s => path.basename(s)).join(', '));

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
