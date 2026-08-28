const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const base = 'https://lesson-code-room.sociobot.in';

async function seriousCritical(page, disableFrameTitle = false) {
  let builder = new AxeBuilder({ page });
  if (disableFrameTitle) builder = builder.disableRules(['frame-title']);
  const result = await builder.analyze();
  return result.violations
    .filter((item) => ['serious', 'critical'].includes(item.impact || ''))
    .map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length }));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const evidence = {};
  const errors = [];
  const requests = [];

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const teacher = await desktop.newPage();
  teacher.on('console', (message) => {
    if (message.type() === 'error') errors.push(`teacher console: ${message.text()}`);
  });
  teacher.on('pageerror', (error) => errors.push(`teacher page: ${error}`));
  teacher.on('request', (request) => requests.push(request.url()));

  const landingResponse = await teacher.goto(`${base}/`, { waitUntil: 'networkidle' });
  const first = await teacher.evaluate(() => {
    const rect = (selector) => {
      const value = document.querySelector(selector)?.getBoundingClientRect();
      return value && { top: Math.round(value.top), bottom: Math.round(value.bottom) };
    };
    return {
      h1: document.querySelector('h1')?.textContent,
      lead: document.querySelector('.hero-lead')?.textContent,
      action: document.querySelector('.hero-action a')?.textContent,
      actionRect: rect('.hero-action a'),
      factTexts: [...document.querySelectorAll('.plain-facts li')].map((item) => item.textContent),
      factsRect: rect('.plain-facts'),
      viewport: { width: innerWidth, height: innerHeight },
      h1s: document.querySelectorAll('h1').length,
      mains: document.querySelectorAll('main').length,
      lang: document.documentElement.lang,
    };
  });
  await teacher.screenshot({ path: '.factory/evidence/verify-4/live-landing-desktop.png', fullPage: true });
  await teacher.keyboard.press('Tab');
  const skip = await teacher.evaluate(() => {
    const element = document.activeElement;
    const style = element && getComputedStyle(element);
    const rect = element && element.getBoundingClientRect();
    return {
      text: element?.textContent?.trim(), tag: element?.tagName,
      outline: style?.outline, top: rect?.top, height: rect?.height,
    };
  });
  await teacher.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }).click();
  await teacher.waitForURL(`${base}/privacy`);
  await teacher.goBack();
  await teacher.waitForURL(`${base}/`);
  const backFocus = await teacher.evaluate(() => ({
    tag: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim(),
    tabindex: document.activeElement?.getAttribute('tabindex'),
  }));

  await teacher.getByRole('link', { name: 'Try it with sample data' }).click();
  await teacher.waitForURL(`${base}/demo`);
  await teacher.getByRole('heading', { level: 1, name: 'Make the night sky respond' }).waitFor();
  const demo = {
    banner: await teacher.getByLabel('Demo mode').innerText(),
    seeded: await Promise.all(['Moss Finch', 'Blue Comet', 'Quiet Fox'].map((name) => teacher.getByText(name).count())),
    joinUrl: await teacher.getByLabel('Learner join link').inputValue(),
  };
  await teacher.getByRole('button', { name: 'Copy join link' }).click();
  demo.copyLabel = await teacher.locator('#copy-link').innerText();

  const learnerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const learner = await learnerContext.newPage();
  learner.on('console', (message) => {
    if (message.type() === 'error') errors.push(`learner console: ${message.text()}`);
  });
  learner.on('pageerror', (error) => errors.push(`learner page: ${error}`));
  learner.on('request', (request) => requests.push(request.url()));
  await learner.goto(demo.joinUrl, { waitUntil: 'networkidle' });
  const demoBannerOnJoin = await learner.getByLabel('Demo mode').count();
  await learner.getByLabel('Screen name').fill('Live QA Lark');
  await learner.getByRole('button', { name: 'Join the exercise' }).click();
  await learner.getByRole('button', { name: 'Run the page' }).waitFor();
  const demoBannerOnWorkbench = await learner.getByLabel('Demo mode').count();
  const mobileWorkbench = await learner.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1s: document.querySelectorAll('h1').length,
    main: Boolean(document.querySelector('main')),
  }));
  await learner.getByLabel('HTML code').fill('<main><h1>Live changed page</h1><p id="qa-output"></p></main>');
  await learner.getByRole('tab', { name: 'CSS' }).click();
  await learner.getByLabel('CSS code').fill('body{background:rgb(12,34,56);color:white;font:18px system-ui}');
  await learner.getByRole('tab', { name: 'JavaScript' }).click();
  await learner.getByLabel('JavaScript code').fill("document.querySelector('#qa-output').textContent='Live script ran'");
  await learner.getByRole('button', { name: 'Run the page' }).click();
  const frame = learner.frameLocator('#result-frame');
  await frame.getByText('Live script ran').waitFor();
  const background = await frame.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  await learner.getByRole('tab', { name: 'JavaScript' }).focus();
  await learner.keyboard.press('ArrowLeft');
  const arrowTab = await learner.evaluate(() => ({
    text: document.activeElement?.textContent,
    selected: document.activeElement?.getAttribute('aria-selected'),
  }));
  await learner.getByRole('button', { name: 'Mark as done' }).click();
  await learner.getByText('Teacher can see: Done').waitFor();
  await teacher.getByText('Live QA Lark').waitFor({ timeout: 10_000 });
  await teacher.getByText('Done', { exact: true }).last().waitFor({ timeout: 10_000 });
  const teacherCounts = await teacher.evaluate(() => ({
    total: document.querySelector('#count-total')?.textContent,
    ran: document.querySelector('#count-ran')?.textContent,
    done: document.querySelector('#count-done')?.textContent,
  }));
  const targetSizes = await learner.locator('button').evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    return { text: button.textContent?.trim(), width: rect.width, height: rect.height };
  }));
  const workbenchAxe = await seriousCritical(learner);
  await learner.screenshot({ path: '.factory/evidence/verify-4/live-workbench-mobile.png', fullPage: true });

  const ordinaryErrors = [...errors];
  await learnerContext.setOffline(true);
  await learner.evaluate(() => window.dispatchEvent(new Event('offline')));
  await learner.getByText('You are offline. Editing and preview still work.').waitFor();
  await learner.getByRole('tab', { name: 'HTML' }).click();
  await learner.getByLabel('HTML code').fill('<h1>Still works offline</h1><p id="qa-output"></p>');
  await learner.getByRole('button', { name: 'Run the page' }).click();
  await frame.getByRole('heading', { name: 'Still works offline' }).waitFor();
  const offlineStatus = await learner.locator('#run-status').innerText();
  const offlineErrors = errors.slice(ordinaryErrors.length);
  await learnerContext.setOffline(false);

  const beforeReset = demo.joinUrl;
  await teacher.getByRole('button', { name: 'Reset demo' }).click();
  await teacher.getByRole('heading', { level: 1, name: 'Make the night sky respond' }).waitFor();
  const afterReset = await teacher.getByLabel('Learner join link').inputValue();

  const desktopAxe = {};
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    const page = await desktop.newPage();
    const routeErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') routeErrors.push(message.text()); });
    page.on('pageerror', (error) => routeErrors.push(String(error)));
    const response = await page.goto(base + path, { waitUntil: 'networkidle' });
    desktopAxe[path] = {
      status: response.status(), title: await page.title(),
      h1: await page.locator('h1').count(), main: await page.locator('main').count(),
      seriousCritical: await seriousCritical(page, true), consoleErrors: routeErrors,
    };
    await page.close();
  }

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on('console', (message) => { if (message.type() === 'error') mobileErrors.push(message.text()); });
  mobilePage.on('pageerror', (error) => mobileErrors.push(String(error)));
  await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const mobileFirst = await mobilePage.evaluate(() => {
    const query = (selector) => document.querySelector(selector);
    const rect = (selector) => {
      const value = query(selector)?.getBoundingClientRect();
      return value && { top: Math.round(value.top), bottom: Math.round(value.bottom), width: Math.round(value.width), height: Math.round(value.height) };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      h1: query('h1')?.textContent,
      lead: query('.hero-lead')?.textContent,
      action: query('.hero-action a')?.textContent,
      actionRect: rect('.hero-action a'), factsRect: rect('.plain-facts'),
      buttonTransition: getComputedStyle(query('.button')).transitionDuration,
      heroAnimation: getComputedStyle(query('.hero-art img')).animationDuration,
    };
  });
  const mobileLandingAxe = await seriousCritical(mobilePage);
  await mobilePage.screenshot({ path: '.factory/evidence/verify-4/live-landing-mobile.png', fullPage: true });

  evidence.firstRead = { httpStatus: landingResponse.status(), ...first, skip, backFocus };
  evidence.demo = { ...demo, demoBannerOnJoin, demoBannerOnWorkbench, beforeReset, afterReset, resetChangedRoom: beforeReset !== afterReset };
  evidence.flow = { previewText: 'Live script ran', background, arrowTab, teacherCounts, mobileWorkbench, targetSizes, offlineStatus };
  evidence.accessibility = { desktopAxe, workbenchAxe, mobileLandingAxe };
  evidence.mobileReducedMotion = { ...mobileFirst, errors: mobileErrors };
  evidence.privacy = {
    httpRequestOrigins: [...new Set(requests.filter((url) => /^https?:/.test(url)).map((url) => new URL(url).origin))],
    ordinaryErrors,
    offlineErrors,
  };
  console.log(JSON.stringify(evidence, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
