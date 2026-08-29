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
  await learner.getByRole('button', { name: 'Mark as done' }).click();
  await expect(learner.getByText('Teacher can see: Done')).toBeVisible();
  await expect(page.getByText('Done', { exact: true })).toHaveCount(2, { timeout: 7_000 });
});

test('@claim:custom-room a teacher creates and shares custom starter code', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Exercise title').fill('Change one signal');
  await page.getByLabel('HTML').fill('<main><h1>Private starter heading</h1></main>');
  await page.getByRole('button', { name: 'Create room and join link' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Change one signal');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  const learner = await context.newPage();
  await learner.goto(joinUrl);
  await learner.getByLabel('Screen name').fill('Copper Wren');
  await learner.getByRole('button', { name: 'Join the exercise' }).click();
  await expect(learner.getByLabel('HTML code')).toHaveValue('<main><h1>Private starter heading</h1></main>');
});

test('a delayed teacher load cannot overwrite Back, and Forward loads the teacher view again', async ({ page }) => {
  let delayed = true;
  let releaseResponse: (() => void) | undefined;
  let requestStarted!: () => void;
  const requestStartedPromise = new Promise<void>((resolve) => { requestStarted = resolve; });
  await page.route('**/api/rooms/*', async (route) => {
    if (route.request().method() !== 'GET' || !delayed) {
      await route.continue();
      return;
    }
    delayed = false;
    requestStarted();
    await new Promise<void>((resolve) => { releaseResponse = resolve; });
    await route.continue();
  });

  await page.goto('/');
  await page.getByLabel('Exercise title').fill('Back navigation proof');
  await page.getByRole('button', { name: 'Create room and join link' }).click();
  await expect(page).toHaveURL(/\/teach\//);
  await requestStartedPromise;
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Opening teacher room');

  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run one coding exercise together');
  releaseResponse?.();
  await page.waitForTimeout(150);
  await expect(page).toHaveTitle('Lesson Code Room — Run a shared coding exercise');
  await expect(page.getByLabel('Learner join link')).toHaveCount(0);

  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Back navigation proof');
  await expect(page.getByLabel('Learner join link')).toBeVisible();
});

test('a delayed demo load cannot overwrite Back, and Forward opens a fresh demo', async ({ page }) => {
  let delayed = true;
  let releaseResponse: (() => void) | undefined;
  let requestStarted!: () => void;
  const requestStartedPromise = new Promise<void>((resolve) => { requestStarted = resolve; });
  await page.route('**/api/demo', async (route) => {
    if (route.request().method() !== 'POST' || !delayed) {
      await route.continue();
      return;
    }
    delayed = false;
    requestStarted();
    await new Promise<void>((resolve) => { releaseResponse = resolve; });
    await route.continue();
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Demo' }).click();
  await expect(page).toHaveURL('/demo');
  await requestStartedPromise;
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Opening the sample room');

  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run one coding exercise together');
  releaseResponse?.();
  await page.waitForTimeout(150);
  await expect(page.getByLabel('Learner join link')).toHaveCount(0);

  await page.goForward();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByLabel('Learner join link')).toBeVisible();
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

test('@claim:demo-reset reset creates isolated temporary sample data', async ({ page, request }) => {
  const liveResponse = await request.post('/api/rooms', { data: {
    title: 'Live room stays separate', instructions: 'Keep this room available.', html: '<h1>Live</h1>', css: '', javascript: '',
  } });
  expect(liveResponse.ok()).toBeTruthy();
  const liveRoom = (await liveResponse.json()).room;
  await page.goto('/demo');
  const first = await page.getByLabel('Learner join link').inputValue();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const second = await page.getByLabel('Learner join link').inputValue();
  expect(second).not.toBe(first);
  await expect(page.getByText('Moss Finch')).toBeVisible();
  expect((await request.get(`/api/rooms/${liveRoom.id}`)).ok()).toBeTruthy();
});

test('reset demo cancels the previous room poll before showing the fresh room', async ({ page, request }) => {
  await page.goto('/demo');
  const firstJoinUrl = await page.getByLabel('Learner join link').inputValue();
  const firstRoom = new URL(firstJoinUrl).pathname.split('/').pop()!;
  const joined = await request.post(`/api/rooms/${firstRoom}/join`, { data: { name: 'Old Room Only' } });
  expect(joined.ok()).toBeTruthy();
  await expect(page.getByText('Old Room Only')).toBeVisible({ timeout: 7_000 });

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Learner join link')).not.toHaveValue(firstJoinUrl);
  await expect(page.getByText('Moss Finch')).toBeVisible();
  await page.waitForTimeout(3_000);
  await expect(page.getByText('Old Room Only')).toHaveCount(0);
});

test('demo join and workbench retain the persistent sandbox banner', async ({ page }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start for real' })).toBeVisible();
  await page.getByLabel('Screen name').fill('Banner Finch');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start for real' })).toBeVisible();
});

test('@claim:learner-reset restores all starter files and the rendered preview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Reset Starling');
  await page.getByRole('button', { name: 'Join the exercise' }).click();

  const html = page.getByLabel('HTML code');
  const css = page.getByLabel('CSS code');
  const javascript = page.getByLabel('JavaScript code');
  const original = {
    html: await html.inputValue(),
    css: await css.inputValue(),
    javascript: await javascript.inputValue(),
  };

  await html.fill('<main><h1>Edited learner page</h1><p id="edited-output"></p></main>');
  await page.getByRole('tab', { name: 'CSS' }).click();
  await css.fill('body { background: rgb(255, 0, 0); color: white; }');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  await javascript.fill("document.querySelector('#edited-output').textContent = 'Edited script ran';");
  await page.getByRole('button', { name: 'Run the page' }).click();
  const preview = page.frameLocator('#result-frame');
  await expect(preview.getByRole('heading', { name: 'Edited learner page' })).toBeVisible();
  await expect(preview.getByText('Edited script ran')).toBeVisible();
  await expect.poll(() => preview.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).toBe('rgb(255, 0, 0)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Reset all three files to the teacher’s starter code? Your edits will be replaced.');
    await dialog.accept();
  });
  const reset = page.getByRole('button', { name: 'Reset starter code' });
  await reset.focus();
  await expect(reset).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(html).toHaveValue(original.html);
  await expect(css).toHaveValue(original.css);
  await expect(javascript).toHaveValue(original.javascript);
  await expect(page.getByText('Starter code restored')).toBeVisible();
  await expect(preview.getByRole('heading', { name: 'Good evening, coders.' })).toBeVisible();
  await expect.poll(() => preview.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).toBe('rgb(7, 21, 31)');
  await preview.getByRole('button', { name: 'Send a signal' }).click();
  await expect(preview.getByText('Signal received.')).toBeVisible();
});

test('@claim:privacy-code learner edits are not sent in progress updates', async ({ page }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Amber Owl');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  const privateCode = 'PRIVATE_LEARNER_CHANGE_9182';
  await page.locator('[data-code="html"]').fill(`<main><button id="signal">Run</button><h1>${privateCode}</h1><p id="reply"></p></main>`);
  const requestsBeforeRun: string[] = [];
  const observe = (request: import('@playwright/test').Request) => {
    if (request.url().includes('/progress') && request.method() === 'POST') requestsBeforeRun.push(request.postData() ?? '');
  };
  page.on('request', observe);
  await page.waitForTimeout(250);
  expect(requestsBeforeRun).toEqual([]);
  const requestPromise = page.waitForRequest((request) => request.url().includes('/progress') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Run the page' }).click();
  const progressRequest = await requestPromise;
  page.off('request', observe);
  expect(progressRequest.postData()).not.toContain(privateCode);
  expect(Object.keys(JSON.parse(progressRequest.postData() ?? '{}')).sort()).toEqual(['learner_token', 'status']);
  expect(JSON.parse(progressRequest.postData() ?? '{}')).toEqual(expect.objectContaining({ status: 'ran' }));
});

test('@claim:teacher-report-limits teacher reports contain progress but no grades or detailed activity', async ({ request }) => {
  const demoResponse = await request.post('/api/demo', { data: {} });
  const demo = await demoResponse.json();
  const joinResponse = await request.post(`/api/rooms/${demo.room.id}/join`, { data: { name: 'Report Finch' } });
  const joined = await joinResponse.json();
  await request.post(`/api/rooms/${demo.room.id}/progress`, { data: { learner_token: joined.learner_token, status: 'ran' } });
  const progressResponse = await request.get(`/api/rooms/${demo.room.id}/progress`, {
    headers: { 'x-teacher-token': demo.teacher_token },
  });
  const progress = await progressResponse.json();
  expect(Object.keys(progress).sort()).toEqual(['counts', 'participants']);
  expect(Object.keys(progress.counts).sort()).toEqual(['done', 'joined', 'ran']);
  for (const participant of progress.participants) {
    expect(Object.keys(participant).sort()).toEqual(['name', 'status']);
    expect(['joined', 'ran', 'done']).toContain(participant.status);
  }
  expect(JSON.stringify(progress)).not.toMatch(/grade|score|keystroke|tab|activity|code/i);
});

test('@claim:product-scope the workbench has code tools but no repository or call controls', async ({ page }) => {
  const response = await page.goto('/demo');
  expect(response?.headers()['permissions-policy']).toContain('camera=()');
  expect(response?.headers()['permissions-policy']).toContain('microphone=()');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Scope Otter');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await expect(page.getByRole('tab')).toHaveCount(3);
  expect(await page.getByRole('tab').allTextContents()).toEqual(['HTML', 'CSS', 'JavaScript']);
  await expect(page.locator('video, audio, input[type="file"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /repository|grade|video|camera|microphone|call/i })).toHaveCount(0);
});

test('@claim:no-tracking landing and full demo flow load only product resources', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.goto('/privacy');
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Private Lark');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await page.getByRole('button', { name: 'Run the page' }).click();
  const productOrigin = new URL(page.url()).origin;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((url) => ['http:', 'https:'].includes(new URL(url).protocol) && new URL(url).origin !== productOrigin)).toEqual([]);
});

test('@claim:session-storage room keys stay in one tab, not persistent browser storage', async ({ page, context }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  const roomId = new URL(joinUrl).pathname.split('/').pop()!;
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Session Heron');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await expect(page.getByRole('button', { name: 'Run the page' })).toBeVisible();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), `learner:${roomId}`)).not.toBeNull();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('learner:')))).toEqual([]);
  const otherTab = await context.newPage();
  await otherTab.goto(joinUrl);
  await expect(otherTab.getByLabel('Screen name')).toBeVisible();
});

test('@claim:offline-preview a loaded workbench edits and previews while offline', async ({ page, context }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Offline Swift');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await page.getByRole('button', { name: 'Run the page' }).click();
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('You are offline. Editing and preview still work.')).toBeVisible();
  await page.getByLabel('HTML code').fill('<main><h1>Offline preview changed</h1><button id="signal">Run</button><p id="reply"></p></main>');
  await page.getByRole('button', { name: 'Run the page' }).click();
  await expect(page.frameLocator('#result-frame').getByRole('heading', { name: 'Offline preview changed' })).toBeVisible();
  await expect(page.getByText('Preview ran. Reconnect, then run again to update progress.')).toBeVisible();
  await context.setOffline(false);
});

test('learner preview runs repeatedly without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Repeat Wren');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await page.getByRole('button', { name: 'Run the page' }).click();
  await page.getByRole('button', { name: 'Run the page' }).click();
  await expect(page.getByText('Teacher can see: Ran code')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a sandbox JavaScript error is visible and does not claim successful progress', async ({ page }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Error Wren');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  await page.getByLabel('JavaScript code').fill("throw new Error('Deliberate preview failure');");
  await page.getByRole('button', { name: 'Run the page' }).click();
  await expect(page.getByText(/Your code could not run: Deliberate preview failure/)).toBeVisible();
  await expect(page.getByText('Teacher can see: Ran code')).toHaveCount(0);
});

test('done progress is monotonic in the API and learner workbench', async ({ page, context }) => {
  await page.goto('/demo');
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  const teacher = page;
  const learner = await context.newPage();
  await learner.goto(joinUrl);
  await learner.getByLabel('Screen name').fill('State Order');
  await learner.getByRole('button', { name: 'Join the exercise' }).click();
  await learner.getByRole('button', { name: 'Mark as done' }).click();
  await expect(learner.getByText('Teacher can see: Done')).toBeVisible();
  await learner.getByRole('button', { name: 'Run the page' }).click();
  await expect(learner.getByText('Teacher can see: Done')).toBeVisible();
  await expect(learner.getByRole('button', { name: 'Marked as done' })).toBeVisible();
  await expect(teacher.getByText('State Order')).toBeVisible({ timeout: 7_000 });
  const card = teacher.locator('.participant', { hasText: 'State Order' });
  await expect(card.getByText('Done', { exact: true })).toBeVisible();
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

test('@claim:paid-checkout uses the Sociobot hosted purchase, recorded-valid backend verification, and 30-learner capacity', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Buy Room Plus' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/lesson-code-room/checkout');
  const checkout = await page.request.get('https://api.sociobot.in/api/v1/products/lesson-code-room/checkout', { maxRedirects: 0 });
  expect(checkout.status()).toBeGreaterThanOrEqual(300);
  expect(checkout.status()).toBeLessThan(400);
  expect(checkout.headers().location).toBeTruthy();
  await page.route('https://api.sociobot.in/api/v1/products/lesson-code-room/verify**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.getByRole('button', { name: 'Restore a license' }).click();
  await page.getByLabel('License token').fill('test-room-plus-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('Room Plus is active. New rooms allow 30 learners.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:lesson-code-room'))).toBe('test-room-plus-token');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sb_license_verdict:lesson-code-room')) ?? '{}')).toEqual(expect.objectContaining({ valid: true }));

  const created = await request.post('/api/rooms', { data: {
    title: 'Licensed capacity proof', instructions: 'Join this recorded-license room.', html: '<h1>Ready</h1>', css: '', javascript: '',
    license: 'recorded-room-plus-license',
  }, headers: { 'X-Forwarded-For': '198.51.100.90' } });
  expect(created.ok()).toBeTruthy();
  const licensed = await created.json();
  expect(licensed.paid_capacity).toBe(true);
  expect(licensed.room.capacity).toBe(30);

  const joins = await Promise.all(Array.from({ length: 31 }, (_, index) => request.post(`/api/rooms/${licensed.room.id}/join`, {
    data: { name: `Licensed learner ${index + 1}` },
    headers: { 'X-Forwarded-For': `198.51.101.${index + 1}` },
  })));
  expect(joins.filter((response) => response.status() === 200)).toHaveLength(30);
  expect(joins.filter((response) => response.status() === 409)).toHaveLength(1);
});

test('every annotated visitor claim is inventoried and every inventory id is published', async ({ page }) => {
  const claims = JSON.parse(await readFile('.factory/claims.json', 'utf8')) as Array<{ id: string }>;
  const inventory = new Set(claims.map((claim) => claim.id));
  const published = new Set<string>();
  const collect = async () => {
    const annotations = await page.locator('[data-claim]').evaluateAll((elements) => elements.flatMap((element) => (element.getAttribute('data-claim') ?? '').split(/\s+/).filter(Boolean)));
    for (const id of annotations) {
      expect(inventory.has(id), `${page.url()} publishes unlisted claim ${id}`).toBe(true);
      published.add(id);
    }
  };
  for (const route of ['/', '/privacy', '/terms', '/demo']) {
    await page.goto(route);
    await collect();
  }
  const joinUrl = await page.getByLabel('Learner join link').inputValue();
  await page.goto(joinUrl);
  await page.getByLabel('Screen name').fill('Claims Robin');
  await page.getByRole('button', { name: 'Join the exercise' }).click();
  await collect();
  for (const id of inventory) expect(published.has(id), `claim ${id} is not attached to published copy`).toBe(true);
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

  const missing = await page.goto('/missing-classroom');
  expect(missing?.status()).toBe(404);
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('@claim:rate-limit API bursts are limited with retry guidance', async ({ request }) => {
  const responses = await Promise.all(Array.from({ length: 48 }, () => request.post('/api/demo', { data: {}, headers: { 'X-Forwarded-For': '198.51.100.22' } })));
  expect(responses.filter((response) => response.status() === 200)).toHaveLength(13);
  const limited = responses.filter((response) => response.status() === 429);
  expect(limited).toHaveLength(35);
  expect(limited.every((response) => response.headers()['retry-after'] === '1')).toBe(true);
});

test('rotating a caller supplied forwarding value cannot evade the ingress client limit', async ({ request }) => {
  const responses = await Promise.all(Array.from({ length: 48 }, (_, index) => request.post('/api/demo', {
    data: {}, headers: { 'X-Forwarded-For': `198.51.100.${index + 1}, 203.0.113.9` },
  })));
  expect(responses.filter((response) => response.status() === 200)).toHaveLength(13);
  const limited = responses.filter((response) => response.status() === 429);
  expect(limited).toHaveLength(35);
  expect(limited.every((response) => response.headers()['retry-after'] === '1')).toBe(true);
});

test('participant API data is not stored and only hashed assets are immutable', async ({ request }) => {
  const demo = await request.post('/api/demo', { data: {} });
  expect(demo.headers()['cache-control']).toBe('no-store');
  const created = await demo.json();
  const room = created.room;
  const progress = await request.get(`/api/rooms/${room.id}/progress`, { headers: { 'x-teacher-token': created.teacher_token } });
  // The room fetch itself is participant-adjacent public room data and must not be cached either.
  const roomResponse = await request.get(`/api/rooms/${room.id}`);
  expect(roomResponse.headers()['cache-control']).toBe('no-store');
  expect(progress.headers()['cache-control']).toBe('no-store');
  const hero = await request.get('/assets/classroom-hero.webp');
  expect(hero.headers()['cache-control'] ?? '').not.toContain('immutable');
});

test('390px navigation and footer links meet the 44px touch target baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const link of [page.getByLabel('Lesson Code Room home'), page.getByRole('link', { name: 'Demo' }), page.locator('.footer-links a').nth(0), page.locator('.footer-links a').nth(1), page.locator('.footer-links a').nth(2)]) {
    const box = await link.boundingBox();
    expect(box, 'interactive target must be measurable').not.toBeNull();
    expect(Math.min(box!.width, box!.height), `${await link.innerText()} measured ${box!.width}×${box!.height}`).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/privacy');
  const email = page.getByRole('link', { name: 'privacy@sociobot.in' });
  const emailBox = await email.boundingBox();
  expect(emailBox, 'privacy email must be measurable').not.toBeNull();
  expect(Math.min(emailBox!.width, emailBox!.height), `privacy email measured ${emailBox!.width}×${emailBox!.height}`).toBeGreaterThanOrEqual(44);
});

test('terms name the merchant of record and refund effect', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByText(/Sociobot and Dodo are the merchant of record/)).toBeVisible();
  await expect(page.getByText(/Refunds are handled there and revoke the license/)).toBeVisible();
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
