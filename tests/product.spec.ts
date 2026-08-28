import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test.describe.configure({ mode: 'serial' });

test('landing page states the job and fits a phone', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run one coding exercise together');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  expect(await page.locator('h1').count()).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(consoleErrors).toEqual([]);
  await context.close();
});

test('@claim:anonymous-room learners join without an account and progress reaches the teacher', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  const learner = await context.newPage();
  await learner.goto(joinUrl);
  await learner.getByLabel('Screen name').fill('Green Kite');
  await learner.getByRole('button', { name: 'Join the exercise' }).click();
  await expect(learner.getByRole('heading', { level: 1 })).toHaveText('Make the night sky respond');
  await learner.getByRole('button', { name: 'Run the page' }).click();
  await expect(learner.getByText('Teacher can see: Ran code')).toBeVisible();
  await expect(page.getByText('Green Kite')).toBeVisible({ timeout: 7_000 });
  await expect(page.getByText('Ran code', { exact: true })).toHaveCount(2);
});

test('@claim:sandbox-run edited code runs inside a network-blocked sandbox', async ({ page }) => {
  const outgoing: string[] = [];
  const responses: string[] = [];
  page.on('request', (request) => outgoing.push(request.url()));
  page.on('response', (response) => responses.push(response.url()));
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Silver Moth');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  const html = page.locator('[data-code="html"]');
  await html.fill('<main><h1>My changed signal</h1><p id="result">Ready</p></main>');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  await page.getByRole('tab', { name: 'JavaScript' }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'CSS' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  await page.locator('[data-code="javascript"]').fill("document.querySelector('#result').textContent = 'Code ran'; fetch('https://example.com/leak'); const tag = document.createElement('script'); tag.src = '/api/demo?leak=blocked'; document.body.append(tag)");
  await page.getByRole('button', { name: 'Run the page' }).click();
  const preview = page.frameLocator('#result-frame');
  await expect(preview.getByRole('heading', { name: 'My changed signal' })).toBeVisible();
  await expect(preview.getByText('Code ran')).toBeVisible();
  expect(outgoing.some((url) => url.startsWith('https://example.com'))).toBe(false);
  expect(responses.some((url) => url.includes('leak=blocked'))).toBe(false);
});

test('@claim:demo-reset reset creates a fresh temporary sample room', async ({ page }) => {
  await page.goto('/demo');
  const first = await page.getByLabel('Learner join link').inputValue();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const second = await page.getByLabel('Learner join link').inputValue();
  expect(second).not.toBe(first);
  await expect(page.getByText('Moss Finch')).toBeVisible();
});

test('@claim:privacy-code learner edits are not sent in progress updates', async ({ page }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Amber Owl');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  const privateCode = 'PRIVATE_LEARNER_CHANGE_9182';
  await page.locator('[data-code="html"]').fill(`<h1>${privateCode}</h1>`);
  const requestPromise = page.waitForRequest((request) => request.url().includes('/progress') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Run the page' }).click();
  const progressRequest = await requestPromise;
  expect(progressRequest.postData()).not.toContain(privateCode);
  expect(JSON.parse(progressRequest.postData() ?? '{}')).toEqual(expect.objectContaining({ status: 'ran' }));
});

test('@claim:free-capacity demo API reports the free 10 learner limit', async ({ request }) => {
  const before = Math.floor(Date.now() / 1000);
  const response = await request.post('/api/demo', { data: {} });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.room.capacity).toBe(10);
});

test('@claim:room-retention live rooms expire after 24 hours', async ({ request }) => {
  const before = Math.floor(Date.now() / 1000);
  const response = await request.post('/api/rooms', { data: {
    title: 'Retention check', instructions: 'Run the starter page.', html: '<h1>Ready</h1>', css: '', javascript: '',
  } });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.room.expires_at).toBeGreaterThanOrEqual(before + 86_390);
  expect(body.room.expires_at).toBeLessThanOrEqual(before + 86_410);
});

test('@claim:demo-retention demo API reports two-hour temporary storage', async ({ request }) => {
  const before = Math.floor(Date.now() / 1000);
  const response = await request.post('/api/demo', { data: {} });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.room.expires_at).toBeGreaterThanOrEqual(before + 7_190);
  expect(body.room.expires_at).toBeLessThanOrEqual(before + 7_210);
});

test('@claim:paid-checkout uses the Sociobot hosted purchase and restore contract', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Buy Room Plus' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/lesson-code-room/checkout');
  await page.route('https://api.sociobot.in/api/v1/products/lesson-code-room/verify**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.getByRole('button', { name: 'Restore a license' }).click();
  await page.getByLabel('License token').fill('test-room-plus-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('Room Plus is active. New rooms allow 30 learners.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:lesson-code-room'))).toBe('test-room-plus-token');
});

test('landing, demo, and legal pages have no serious accessibility findings', async ({ page }) => {
  for (const route of ['/', '/demo', '/privacy', '/terms']) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} must be a real 200 route`).toBe(200);
    await page.locator('main h1').waitFor();
    const results = await new AxeBuilder({ page }).disableRules(['frame-title']).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious, `${route}: ${serious.map((item) => item.id).join(', ')}`).toEqual([]);
  }
  const demo = await page.request.post('/api/demo', { data: {} });
  const room = (await demo.json()).room;
  await page.goto(`/room/${room.id}`);
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByLabel('Screen name').fill('A11y Finch');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('all API routes return Retry-After when one client exceeds the limit', async ({ request }) => {
  const responses = await Promise.all(Array.from({ length: 48 }, () => request.post('/api/demo', { data: {}, headers: { 'X-Forwarded-For': '198.51.100.22' } })));
  const limited = responses.find((response) => response.status() === 429);
  expect(limited).toBeTruthy();
  expect(limited?.headers()['retry-after']).toBe('1');
});

test('container defaults to the shared durable store instead of replica-local SQLite', async () => {
  const [dockerfile, server] = await Promise.all([
    readFile('Dockerfile', 'utf8'),
    readFile('src/main.rs', 'utf8'),
  ]);
  expect(dockerfile).not.toMatch(/^ENV DATABASE_URL=/m);
  expect(server).toContain('managed-identity Azure Blob storage (shared)');
  expect(server).toContain('Store::Blob(store)');
});

test('hashed production assets use the immutable cache policy', async ({ page, request }) => {
  await page.goto('/');
  const assetPath = await page.locator('script[type="module"]').getAttribute('src');
  expect(assetPath).toMatch(/^\/assets\/.*\.js$/);
  const response = await request.head(assetPath!);
  expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});
