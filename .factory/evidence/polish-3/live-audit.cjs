const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const base = 'https://lesson-code-room.sociobot.in';
const output = '.factory/evidence/polish-3';

async function seriousCritical(page) {
  const result = await new AxeBuilder({ page }).disableRules(['frame-title']).analyze();
  return result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
}

async function metadata(page) {
  return page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    ogDescription: document.querySelector('meta[property="og:description"]')?.content,
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content,
    twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content,
  }));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const requests = [];
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await mobile.newPage();
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text());
  });
  page.on('request', (request) => requests.push(request.url()));

  const landingResponse = await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  assert.equal(landingResponse.status(), 200);
  assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'Run one coding exercise together');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('main').count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  const landingText = await page.locator('body').innerText();
  for (const removed of ['See the room, not private screens.', 'One room. One exercise. Start teaching.', 'The real first step', 'A short teaching loop', 'A room, not a watchtower']) {
    assert(!landingText.includes(removed), `removed copy returned: ${removed}`);
  }
  assert(landingText.includes('Teachers see screen names and Joined, Ran code, or Done.'));
  await page.screenshot({ path: `${output}/live-landing-mobile.png`, fullPage: true });

  let releaseDemo;
  let demoStarted;
  const started = new Promise((resolve) => { demoStarted = resolve; });
  const hold = new Promise((resolve) => { releaseDemo = resolve; });
  const handler = async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    demoStarted();
    await hold;
    await route.continue();
  };
  await page.route('**/api/demo', handler);
  const demoResponse = page.waitForResponse((response) => response.url().endsWith('/api/demo') && response.request().method() === 'POST');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await started;
  assert.equal(new URL(page.url()).search, '?demo=1');
  assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'Make the night sky respond');
  assert.deepEqual(await page.locator('.participant').allInnerTexts(), [
    'Moss Finch\nDone',
    'Blue Comet\nRan code',
    'Quiet Fox\nJoined',
  ]);
  assert(await page.getByText('Demo — sample data, nothing is saved').isVisible());
  assert(await page.getByRole('button', { name: 'Reset demo' }).isVisible());
  assert(await page.getByRole('link', { name: 'Start for real' }).isVisible());
  assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
  await page.screenshot({ path: `${output}/live-demo-immediate-mobile.png`, fullPage: true });
  releaseDemo();
  const demoJson = await (await demoResponse).json();
  await page.unroute('**/api/demo', handler);
  assert.equal(demoJson.storage, 'demo-blob');
  assert.match(demoJson.room.id, /^DEMO-[A-Z]{6}$/);
  const firstJoinUrl = await page.getByLabel('Learner join link').inputValue();
  assert(firstJoinUrl.includes(`/room/${demoJson.room.id}`));
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.waitForFunction((oldUrl) => document.querySelector('[aria-label="Learner join link"]')?.value !== oldUrl, firstJoinUrl);
  const secondJoinUrl = await page.getByLabel('Learner join link').inputValue();
  assert.notEqual(firstJoinUrl, secondJoinUrl);

  const routeExpectations = [
    ['/', 200, 'Lesson Code Room — Run a shared coding exercise', 'Run one coding exercise together', `${base}/`],
    ['/?demo=1', 200, 'Demo — Lesson Code Room', 'Make the night sky respond', `${base}/demo`],
    ['/privacy', 200, 'Privacy — Lesson Code Room', 'Privacy without a student account', `${base}/privacy`],
    ['/terms', 200, 'Terms — Lesson Code Room', 'Terms for using a lesson room', `${base}/terms`],
    ['/missing-classroom', 404, 'Not found — Lesson Code Room', 'Page not found', `${base}/missing-classroom`],
  ];
  const routes = {};
  for (const [path, status, title, h1, canonical] of routeExpectations) {
    const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), status);
    assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), h1);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('.site-footer a[href="/privacy"]').count(), 1);
    assert.equal(await page.locator('.site-footer a[href="/terms"]').count(), 1);
    const meta = await metadata(page);
    assert.equal(meta.title, title);
    assert.equal(meta.canonical, canonical);
    assert.equal(meta.ogTitle, title);
    assert.equal(meta.twitterTitle, title);
    assert.equal(meta.ogDescription, meta.description);
    assert.equal(meta.twitterDescription, meta.description);
    await page.evaluate(() => document.documentElement.style.setProperty('font-size', '32px', 'important'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    const footerLinks = await page.locator('.footer-links a').evaluateAll((links) => links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }));
    for (let first = 0; first < footerLinks.length; first += 1) {
      assert(footerLinks[first].left >= 0 && footerLinks[first].right <= 390);
      for (let second = first + 1; second < footerLinks.length; second += 1) {
        const overlaps = footerLinks[first].left < footerLinks[second].right
          && footerLinks[first].right > footerLinks[second].left
          && footerLinks[first].top < footerLinks[second].bottom
          && footerLinks[first].bottom > footerLinks[second].top;
        assert.equal(overlaps, false, `${path} footer links overlap at 200% text`);
      }
    }
    const violations = await seriousCritical(page);
    assert.deepEqual(violations.map((violation) => violation.id), []);
    routes[path] = { status, h1, meta, reflow: '390/390', footerLinksOverlap: false, seriousCritical: 0, legalLinks: ['Privacy', 'Terms'] };
  }
  await page.screenshot({ path: `${output}/live-404-mobile.png`, fullPage: true });

  await page.goto(`${base}/`);
  await page.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }).click();
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Privacy without a student account');
  await page.goBack();
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Run one coding exercise together');

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(`${base}/`, { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: `${output}/live-landing-desktop.png`, fullPage: true });
  await desktopPage.goto(`${base}/missing-classroom`, { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: `${output}/live-404-desktop.png`, fullPage: true });

  const health = await (await mobile.request.get(`${base}/health`)).json();
  const assetPath = await desktopPage.locator('script[type="module"]').getAttribute('src');
  const assetResponse = await mobile.request.head(`${base}${assetPath}`);
  assert.equal(assetResponse.headers()['cache-control'], 'public, max-age=31536000, immutable');
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.deepEqual([...new Set(requests.filter((url) => /^https?:/.test(url)).map((url) => new URL(url).origin))], [base]);

  const evidence = {
    checkedAt: new Date().toISOString(),
    base,
    health,
    firstScreen: { h1: 'Run one coding exercise together', width: 390, scrollWidth: 390 },
    demo: { storage: demoJson.storage, firstRoom: demoJson.room.id, resetChangedRoom: firstJoinUrl !== secondJoinUrl, immediateLearners: ['Moss Finch — Done', 'Blue Comet — Ran code', 'Quiet Fox — Joined'] },
    routes,
    focus: { forward: 'Privacy without a student account', back: 'Run one coding exercise together' },
    privacy: { requestOrigins: [base], consoleErrors: errors },
    immutableAsset: { path: assetPath, cacheControl: assetResponse.headers()['cache-control'] },
  };
  fs.writeFileSync(`${output}/live-audit.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
