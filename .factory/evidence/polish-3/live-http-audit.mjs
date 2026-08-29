import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://lesson-code-room.sociobot.in';
const expectedRoutes = new Map([
  ['/', 200],
  ['/?demo=1', 200],
  ['/demo', 200],
  ['/privacy', 200],
  ['/terms', 200],
  ['/robots.txt', 200],
  ['/sitemap.xml', 200],
  ['/sandbox.html', 200],
  ['/missing-classroom', 404],
  ['/health', 200],
]);

const routes = {};
for (const [path, expected] of expectedRoutes) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, expected, path);
  routes[path] = { status: response.status, contentType: response.headers.get('content-type') };
}

const landing = await (await fetch(base)).text();
const asset = landing.match(/src="([^"]+\.js)"/)?.[1];
assert(asset);
const assetResponse = await fetch(`${base}${asset}`, { method: 'HEAD' });
assert.equal(assetResponse.headers.get('cache-control'), 'public, max-age=31536000, immutable');

const sandboxResponse = await fetch(`${base}/sandbox.html`, { method: 'HEAD' });
assert.equal(sandboxResponse.headers.get('x-frame-options'), 'SAMEORIGIN');
assert.match(sandboxResponse.headers.get('content-security-policy') || '', /connect-src 'none'/);

const rateResponses = await Promise.all(Array.from({ length: 60 }, () => fetch(`${base}/api/demo`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
})));
const rateStatuses = Object.fromEntries(Object.entries(Object.groupBy(rateResponses, (response) => response.status)).map(([status, responses]) => [status, responses.length]));
assert(rateStatuses['429'] > 0);
assert(rateResponses.filter((response) => response.status === 429).every((response) => response.headers.get('retry-after') === '1'));

const started = Date.now();
const healthResponses = await Promise.all(Array.from({ length: 100 }, () => fetch(`${base}/health`)));
const elapsedMs = Date.now() - started;
assert.equal(healthResponses.filter((response) => response.status === 200).length, 100);
const health = await healthResponses[0].json();

const evidence = {
  checkedAt: new Date().toISOString(),
  base,
  health,
  routes,
  immutableAsset: { path: asset, cacheControl: assetResponse.headers.get('cache-control') },
  sandbox: {
    frameOptions: sandboxResponse.headers.get('x-frame-options'),
    contentSecurityPolicy: sandboxResponse.headers.get('content-security-policy'),
  },
  rateLimit: { requests: 60, statuses: rateStatuses, allLimitedResponsesHaveRetryAfterOne: true },
  loadSmoke: { requests: 100, successful: 100, elapsedMs, observedRps: Math.round(100000 / elapsedMs) },
};

await writeFile('.factory/evidence/polish-3/live-http-audit.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
