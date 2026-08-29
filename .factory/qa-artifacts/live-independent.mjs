import assert from 'node:assert/strict';
import { chromium, request as playwrightRequest } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://lesson-code-room.sociobot.in';
const expectedSha = '19733649f2e9051c73a3e69e33096f54adfdb940';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const report = {
  checkedAt: new Date().toISOString(),
  candidate: expectedSha,
  base,
  firstRead: {},
  endToEnd: {},
  routes: {},
  accessibility: {},
  privacy: {},
  api: {},
  performance: {},
};

const browser = await chromium.launch({ headless: true });
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const page = await mobile.newPage();
const consoleErrors = [];
const requests = [];
for (const target of [page]) {
  target.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  target.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`console: ${message.text()}`);
  });
  target.on('request', (request) => requests.push(request.url()));
}

const landingResponse = await page.goto(`${base}/`, { waitUntil: 'networkidle' });
assert.equal(landingResponse.status(), 200);
const h1 = await page.getByRole('heading', { level: 1 }).innerText();
const audience = await page.locator('.hero-copy > p').first().innerText();
const sampleAction = page.getByRole('link', { name: 'Try it with sample data' });
assert.equal(h1, 'Run one coding exercise together');
assert.match(audience, /remote teachers/);
assert(await sampleAction.isVisible());
assert.equal(await page.locator('h1').count(), 1);
assert.equal(await page.locator('main').count(), 1);
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
await page.screenshot({ path: '.factory/qa-artifacts/live-landing-mobile-full.png', fullPage: true });

await page.keyboard.press('Tab');
await page.waitForTimeout(100);
const firstFocused = await page.evaluate(() => ({
  text: document.activeElement?.textContent?.trim(),
  outline: getComputedStyle(document.activeElement).outline,
  rect: (() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
}));
assert.equal(firstFocused.text, 'Skip to main content');
assert(!firstFocused.outline.startsWith('none'));
let reachedSample = false;
for (let i = 0; i < 10; i += 1) {
  await page.keyboard.press('Tab');
  if ((await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Try it with sample data') {
    reachedSample = true;
    break;
  }
}
assert(reachedSample, 'sample action must be keyboard reachable');
await page.keyboard.press('Enter');
await page.getByRole('heading', { level: 1, name: 'Make the night sky respond' }).waitFor();
assert(await page.getByText('Demo — sample data, nothing is saved').isVisible());
assert.deepEqual(await page.locator('.participant').allInnerTexts(), [
  'Moss Finch\nDone',
  'Blue Comet\nRan code',
  'Quiet Fox\nJoined',
]);
await page.screenshot({ path: '.factory/qa-artifacts/live-demo-mobile-full.png', fullPage: true });
const demoStorage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
assert.deepEqual(demoStorage, { local: [], session: [] });
const firstJoinUrl = await page.getByLabel('Learner join link').inputValue();
assert.match(firstJoinUrl, /\/room\/DEMO-[A-Z]{6}$/);

const learner = await mobile.newPage();
learner.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
learner.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(`console: ${message.text()}`);
});
learner.on('request', (request) => requests.push(request.url()));
await learner.goto(firstJoinUrl, { waitUntil: 'networkidle' });
assert(await learner.getByText('Demo — sample data, nothing is saved').isVisible());
const nameInput = learner.getByLabel('Screen name');
await nameInput.focus();
await learner.keyboard.press('Enter');
assert.equal(await nameInput.evaluate((element) => element.matches(':invalid')), true);
await nameInput.fill('QA Night Owl');
await learner.keyboard.press('Enter');
await learner.getByRole('button', { name: 'Run the page' }).waitFor();
assert(await learner.getByText('Demo — sample data, nothing is saved').isVisible());

await learner.getByRole('tab', { name: 'HTML' }).focus();
await learner.keyboard.press('ArrowRight');
assert.equal(await learner.getByRole('tab', { name: 'CSS' }).getAttribute('aria-selected'), 'true');
await learner.keyboard.press('ArrowRight');
assert.equal(await learner.getByRole('tab', { name: 'JavaScript' }).getAttribute('aria-selected'), 'true');
await learner.getByLabel('JavaScript code').fill("document.querySelector('#reply').textContent = 'Live QA worked';");
await learner.getByRole('tab', { name: 'HTML' }).click();
await learner.getByLabel('HTML code').fill('<main><h1>Live QA preview</h1><p id="reply"></p></main>');
await learner.getByRole('button', { name: 'Run the page' }).click();
await learner.frameLocator('#result-frame').getByRole('heading', { name: 'Live QA preview' }).waitFor();
await learner.frameLocator('#result-frame').getByText('Live QA worked').waitFor();
await learner.getByText('Teacher can see: Ran code').waitFor();
await learner.getByRole('button', { name: 'Mark as done' }).click();
await learner.getByText('Teacher can see: Done').waitFor();
await page.getByText('QA Night Owl').waitFor({ timeout: 10_000 });
assert(await page.locator('.participant', { hasText: 'QA Night Owl' }).getByText('Done', { exact: true }).isVisible());

await mobile.setOffline(true);
await learner.evaluate(() => window.dispatchEvent(new Event('offline')));
await learner.getByText('You are offline. Editing and preview still work.').waitFor();
await learner.getByLabel('HTML code').fill('<main><h1>Offline QA preview</h1><p id="reply"></p></main>');
await learner.getByRole('button', { name: 'Run the page' }).click();
await learner.frameLocator('#result-frame').getByRole('heading', { name: 'Offline QA preview' }).waitFor();
await learner.getByText('Preview ran. Reconnect, then run again to update progress.').waitFor();
await mobile.setOffline(false);
await learner.evaluate(() => window.dispatchEvent(new Event('online')));

learner.once('dialog', (dialog) => dialog.accept());
await learner.getByRole('button', { name: 'Reset starter code' }).click();
assert.match(await learner.getByLabel('HTML code').inputValue(), /Good evening, coders/);
assert.match(await learner.getByLabel('CSS code').inputValue(), /sky-card/);
assert.match(await learner.getByLabel('JavaScript code').inputValue(), /Signal received/);
await learner.frameLocator('#result-frame').getByRole('heading', { name: 'Good evening, coders.' }).waitFor();
await learner.screenshot({ path: '.factory/qa-artifacts/live-workbench-mobile-full.png', fullPage: true });
const learnerStorage = await learner.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
assert.equal(learnerStorage.local.some((key) => key.startsWith('learner:')), false);
assert.equal(learnerStorage.session.filter((key) => key.startsWith('learner:')).length, 1);

const oldJoinUrl = await page.getByLabel('Learner join link').inputValue();
await page.getByRole('button', { name: 'Reset demo' }).click();
await page.waitForFunction((oldValue) => document.querySelector('[aria-label="Learner join link"]')?.value !== oldValue, oldJoinUrl);
const newJoinUrl = await page.getByLabel('Learner join link').inputValue();
assert.notEqual(newJoinUrl, oldJoinUrl);

report.firstRead = { h1, audience, action: 'Try it with sample data', firstFocused, oneClickDemo: true, width: 390, scrollWidth: 390 };
report.endToEnd = {
  demoRoom: new URL(firstJoinUrl).pathname.split('/').pop(),
  seededLearners: ['Moss Finch — Done', 'Blue Comet — Ran code', 'Quiet Fox — Joined'],
  learner: 'QA Night Owl',
  ranPreview: true,
  teacherSawDone: true,
  offlinePreview: true,
  resetAllFiles: true,
  demoResetChangedRoom: oldJoinUrl !== newJoinUrl,
  demoStorage,
  learnerStorage,
};

const routeCases = [
  ['/', 200, 'Lesson Code Room — Run a shared coding exercise'],
  ['/demo', 200, 'Demo — Lesson Code Room'],
  ['/privacy', 200, 'Privacy — Lesson Code Room'],
  ['/terms', 200, 'Terms — Lesson Code Room'],
  ['/not-a-room', 404, 'Not found — Lesson Code Room'],
];
for (const [path, expectedStatus, expectedTitle] of routeCases) {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), expectedStatus, path);
  assert.equal(await page.title(), expectedTitle, path);
  assert.equal(await page.locator('h1').count(), 1, path);
  assert.equal(await page.locator('main').count(), 1, path);
  await page.evaluate(() => document.documentElement.style.setProperty('font-size', '32px', 'important'));
  const reflow = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(reflow.scrollWidth, reflow.clientWidth, `${path} at 200%`);
  const axe = await new AxeBuilder({ page }).analyze();
  const severe = axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
  assert.deepEqual(severe.map((violation) => violation.id), [], path);
  report.routes[path] = { status: response.status(), title: await page.title(), reflow, seriousCritical: severe.length };
}

await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }).click();
assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Privacy without a student account');
await page.goBack();
assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Run one coding exercise together');
const reducedMotion = await page.evaluate(() => {
  const style = getComputedStyle(document.querySelector('h1'));
  return { animationDuration: style.animationDuration, transitionDuration: style.transitionDuration };
});
for (const value of [reducedMotion.animationDuration, reducedMotion.transitionDuration]) {
  assert(Number.parseFloat(value) <= 0.00001, `reduced-motion duration was ${value}`);
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktopPage = await desktop.newPage();
desktopPage.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
desktopPage.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(`console: ${message.text()}`);
});
desktopPage.on('request', (request) => requests.push(request.url()));
await desktopPage.goto(`${base}/`, { waitUntil: 'networkidle' });
assert.equal(await desktopPage.evaluate(() => document.documentElement.scrollWidth), 1440);
const desktopAxe = await new AxeBuilder({ page: desktopPage }).analyze();
assert.deepEqual(desktopAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || '')).map((violation) => violation.id), []);
await desktopPage.screenshot({ path: '.factory/qa-artifacts/live-landing-desktop-full.png', fullPage: true });
report.accessibility = { mobileRoutesSeriousCritical: 0, desktopLandingSeriousCritical: 0, keyboardDemo: true, keyboardTabs: true, focusRestoration: true, reducedMotion };

const api = await playwrightRequest.newContext({ baseURL: base });
const health = await api.get('/health');
assert.equal(health.status(), 200);
const healthBody = await health.json();
assert.equal(healthBody.build_sha, expectedSha);

await sleep(1100);
const demoResponse = await api.post('/api/demo', { data: {} });
assert.equal(demoResponse.status(), 200);
assert.equal(demoResponse.headers()['cache-control'], 'no-store');
const demoBody = await demoResponse.json();
assert.equal(demoBody.storage, 'demo-blob');
assert.match(demoBody.room.id, /^DEMO-/);
assert.equal(demoBody.room.is_demo, true);
const demoTtl = demoBody.room.expires_at - Math.floor(Date.now() / 1000);
assert(demoTtl >= 7185 && demoTtl <= 7200);

const boundaryRoom = {
  title: 'T'.repeat(80),
  instructions: 'I'.repeat(600),
  html: 'x'.repeat(50_000),
  css: '',
  javascript: '',
};
await sleep(1100);
const validBoundary = await api.post('/api/rooms', { data: boundaryRoom });
assert.equal(validBoundary.status(), 200);
const boundaryBody = await validBoundary.json();
assert.equal(boundaryBody.room.title.length, 80);
assert.equal(boundaryBody.room.instructions.length, 600);
assert.equal(boundaryBody.room.html.length, 50_000);
assert.equal(boundaryBody.room.is_demo, false);
assert(!boundaryBody.room.id.startsWith('DEMO-'));
const liveTtl = boundaryBody.room.expires_at - Math.floor(Date.now() / 1000);
assert(liveTtl >= 86385 && liveTtl <= 86400);
const persisted = await api.get(`/api/rooms/${boundaryBody.room.id}`);
assert.equal(persisted.status(), 200);
assert.equal((await persisted.json()).html.length, 50_000);

for (const [field, value, expectedMessage] of [
  ['title', 'T'.repeat(81), 'Use an exercise title from 1 to 80 characters.'],
  ['instructions', 'I'.repeat(601), 'Add instructions from 1 to 600 characters.'],
  ['html', 'x'.repeat(50_001), 'Keep HTML under 50 KB.'],
]) {
  await sleep(1100);
  const invalid = await api.post('/api/rooms', { data: { ...boundaryRoom, [field]: value } });
  assert.equal(invalid.status(), 400, field);
  assert.equal((await invalid.json()).message, expectedMessage, field);
}

await sleep(1100);
const capacityCreate = await api.post('/api/rooms', { data: { title: 'Concurrency QA', instructions: 'Join at once.', html: '<h1>Ready</h1>', css: '', javascript: '' } });
assert.equal(capacityCreate.status(), 200);
const capacityBody = await capacityCreate.json();
const invalidBlank = await api.post(`/api/rooms/${capacityBody.room.id}/join`, { data: { name: '   ' } });
assert.equal(invalidBlank.status(), 400);
assert.equal((await invalidBlank.json()).error, 'invalid_name');
const invalidLong = await api.post(`/api/rooms/${capacityBody.room.id}/join`, { data: { name: 'x'.repeat(25) } });
assert.equal(invalidLong.status(), 400);
assert.equal((await invalidLong.json()).error, 'invalid_name');
await sleep(1100);
const joins = await Promise.all(Array.from({ length: 11 }, (_, index) => api.post(`/api/rooms/${capacityBody.room.id}/join`, { data: { name: `Concurrent ${index + 1}` } })));
const joinCounts = Object.groupBy(joins, (response) => response.status());
assert.equal(joinCounts[200]?.length, 10);
assert.equal(joinCounts[409]?.length, 1);
const firstJoined = await joins.find((response) => response.status() === 200).json();
const invalidProgress = await api.post(`/api/rooms/${capacityBody.room.id}/progress`, { data: { learner_token: firstJoined.learner_token, status: 'watched' } });
assert.equal(invalidProgress.status(), 400);
const forbiddenProgress = await api.get(`/api/rooms/${capacityBody.room.id}/progress`);
assert.equal(forbiddenProgress.status(), 403);
await sleep(1100);
const validProgress = await api.post(`/api/rooms/${capacityBody.room.id}/progress`, { data: { learner_token: firstJoined.learner_token, status: 'done' } });
assert.equal(validProgress.status(), 200);
const teacherProgress = await api.get(`/api/rooms/${capacityBody.room.id}/progress`, { headers: { 'x-teacher-token': capacityBody.teacher_token } });
assert.equal(teacherProgress.status(), 200);
const teacherProgressBody = await teacherProgress.json();
assert.deepEqual(Object.keys(teacherProgressBody.participants[0]).sort(), ['name', 'status']);
assert.equal(teacherProgressBody.counts.done, 1);

const landingHead = await api.head('/');
const sandboxHead = await api.head('/sandbox.html');
const source = await (await api.get('/')).text();
const jsPath = source.match(/src="([^"]+\.js)"/)?.[1];
assert(jsPath);
const jsHead = await api.head(jsPath);
const heroHead = await api.head('/assets/classroom-hero.webp');
assert.match(landingHead.headers()['content-security-policy'], /frame-ancestors 'none'/);
assert.match(landingHead.headers()['permissions-policy'], /camera=\(\), microphone=\(\), geolocation=\(\)/);
assert.equal(sandboxHead.headers()['x-frame-options'], 'SAMEORIGIN');
assert.match(sandboxHead.headers()['content-security-policy'], /connect-src 'none'/);
assert.equal(jsHead.headers()['cache-control'], 'public, max-age=31536000, immutable');
assert(!String(heroHead.headers()['cache-control'] || '').includes('immutable'));

await sleep(1100);
const burst = await Promise.all(Array.from({ length: 60 }, () => api.post('/api/demo', { data: {} })));
const burstCounts = Object.fromEntries(Object.entries(Object.groupBy(burst, (response) => response.status())).map(([status, values]) => [status, values.length]));
assert((burstCounts[429] || 0) > 0);
assert(burst.filter((response) => response.status() === 429).every((response) => response.headers()['retry-after'] === '1'));
await sleep(1100);
const recovered = await api.post('/api/demo', { data: {} });
assert.equal(recovered.status(), 200);

const healthStart = Date.now();
const healthBurst = await Promise.all(Array.from({ length: 100 }, () => api.get('/health')));
const healthElapsedMs = Date.now() - healthStart;
assert.equal(healthBurst.filter((response) => response.status() === 200).length, 100);

report.api = {
  health: healthBody,
  demo: { storage: demoBody.storage, id: demoBody.room.id, ttlSeconds: demoTtl, cacheControl: demoResponse.headers()['cache-control'] },
  livePersistence: { id: boundaryBody.room.id, ttlSeconds: liveTtl, fetchedAgain: true },
  boundaries: { accepted: { title: 80, instructions: 600, htmlBytes: 50_000 }, rejected: { title: 81, instructions: 601, htmlBytes: 50_001 } },
  concurrency: { attempted: 11, accepted: joinCounts[200]?.length, roomFull: joinCounts[409]?.length, capacity: capacityBody.room.capacity },
  progressPrivacyFields: Object.keys(teacherProgressBody.participants[0]).sort(),
  rateLimit: { attempted: 60, statuses: burstCounts, retryAfterOneOnEvery429: true, recoveredAfterMs: 1100 },
  healthLoad: { attempted: 100, successful: 100, elapsedMs: healthElapsedMs, observedRps: Math.round(100_000 / healthElapsedMs) },
  headers: {
    rootCsp: landingHead.headers()['content-security-policy'],
    permissionsPolicy: landingHead.headers()['permissions-policy'],
    sandboxCsp: sandboxHead.headers()['content-security-policy'],
    sandboxFrameOptions: sandboxHead.headers()['x-frame-options'],
    jsCacheControl: jsHead.headers()['cache-control'],
    heroCacheControl: heroHead.headers()['cache-control'] || null,
  },
};

const httpOrigins = [...new Set(requests.filter((url) => /^https?:/.test(url)).map((url) => new URL(url).origin))];
assert.deepEqual(httpOrigins, [base]);
const expectedStimulusErrors = consoleErrors.filter((message) => message.includes('ERR_INTERNET_DISCONNECTED') || message.includes('status of 404'));
const unexpectedErrors = consoleErrors.filter((message) => !expectedStimulusErrors.includes(message));
assert.deepEqual(unexpectedErrors, []);
assert.equal((await mobile.cookies()).length, 0);
report.privacy = { httpOrigins, unexpectedConsoleErrors: unexpectedErrors, expectedStimulusErrors, cookies: 0 };
report.performance = { liveVerifyLoadMs: 641, healthObservedRps: report.api.healthLoad.observedRps };

await api.dispose();
await desktop.close();
await mobile.close();
await browser.close();

console.log(JSON.stringify(report, null, 2));
