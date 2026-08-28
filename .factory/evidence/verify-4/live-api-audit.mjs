const base = 'https://lesson-code-room.sociobot.in';

async function call(path, options = {}) {
  const response = await fetch(base + path, options);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: response.status, headers: Object.fromEntries(response.headers), body };
}

const roomInput = (overrides = {}) => ({
  title: 'Independent QA room',
  instructions: 'Change the heading, run the page, and mark done.',
  html: '<main><h1>QA starter</h1></main>',
  css: 'body { color: #123456; }',
  javascript: 'document.body.dataset.ready = "yes";',
  ...overrides,
});

const create = await call('/api/rooms', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.101' },
  body: JSON.stringify(roomInput()),
});
const id = create.body.room.id;
const teacherToken = create.body.teacher_token;

const joins = await Promise.all(Array.from({ length: 12 }, (_, index) => call(`/api/rooms/${id}/join`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.101.${index + 1}` },
  body: JSON.stringify({ name: `Learner ${index + 1}` }),
})));
const accepted = joins.filter((item) => item.status === 200);
const learnerToken = accepted[0].body.learner_token;

const boundaries = {};
for (const [name, input] of Object.entries({
  blankTitle: roomInput({ title: '  ' }),
  title81: roomInput({ title: 'x'.repeat(81) }),
  blankInstructions: roomInput({ instructions: '   ' }),
  instructions601: roomInput({ instructions: 'x'.repeat(601) }),
  html50001: roomInput({ html: 'x'.repeat(50_001) }),
})) {
  boundaries[name] = await call('/api/rooms', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${Object.keys(boundaries).length + 1}` },
    body: JSON.stringify(input),
  });
}

const nameRoom = await call('/api/rooms', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.102' }, body: JSON.stringify(roomInput({ title: 'Name boundaries' })),
});
const nameId = nameRoom.body.room.id;
const nameChecks = {
  blank: await call(`/api/rooms/${nameId}/join`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' }, body: JSON.stringify({ name: '   ' }) }),
  unicode24: await call(`/api/rooms/${nameId}/join`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.11' }, body: JSON.stringify({ name: '🦉'.repeat(24) }) }),
  unicode25: await call(`/api/rooms/${nameId}/join`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.12' }, body: JSON.stringify({ name: '🦉'.repeat(25) }) }),
};

const progress = {
  wrongToken: await call(`/api/rooms/${id}/progress`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.20' }, body: JSON.stringify({ learner_token: 'wrong', status: 'done' }) }),
  invalidState: await call(`/api/rooms/${id}/progress`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.21' }, body: JSON.stringify({ learner_token: learnerToken, status: 'typing' }) }),
  done: await call(`/api/rooms/${id}/progress`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.22' }, body: JSON.stringify({ learner_token: learnerToken, status: 'done' }) }),
  wrongTeacher: await call(`/api/rooms/${id}/progress`, { headers: { 'x-teacher-token': 'wrong', 'x-forwarded-for': '203.0.113.23' } }),
  teacher: await call(`/api/rooms/${id}/progress`, { headers: { 'x-teacher-token': teacherToken, 'x-forwarded-for': '203.0.113.24' } }),
};

await new Promise((resolve) => setTimeout(resolve, 2200));
const persistence = await call(`/api/rooms/${id}`, { headers: { 'x-forwarded-for': '203.0.113.25' } });
const lowercase = await call(`/api/rooms/${id.toLowerCase()}`, { headers: { 'x-forwarded-for': '203.0.113.26' } });
const missing = await call('/api/rooms/ZZZZZZ', { headers: { 'x-forwarded-for': '203.0.113.27' } });

const loadStart = performance.now();
const loadResponses = await Promise.all(Array.from({ length: 100 }, (_, index) => call(`/api/rooms/${id}`, {
  headers: { 'x-forwarded-for': `192.0.2.${(index % 200) + 1}` },
})));
const loadMs = Math.round(performance.now() - loadStart);

const rateResponses = await Promise.all(Array.from({ length: 48 }, () => call('/api/demo', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.231' }, body: '{}',
})));
const statusCounts = rateResponses.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {});
const retryAfter = [...new Set(rateResponses.filter((item) => item.status === 429).map((item) => item.headers['retry-after']))];

console.log(JSON.stringify({
  create: { status: create.status, room: create.body.room, paidCapacity: create.body.paid_capacity },
  capacity: { statuses: joins.map((item) => item.status), accepted: accepted.length, rejected: joins.filter((item) => item.status === 409).length },
  boundaries: Object.fromEntries(Object.entries(boundaries).map(([key, value]) => [key, { status: value.status, body: value.body }])),
  nameChecks: Object.fromEntries(Object.entries(nameChecks).map(([key, value]) => [key, {
    status: value.status,
    body: value.status === 200 ? { participant: value.body.participant } : value.body,
  }])),
  progress: Object.fromEntries(Object.entries(progress).map(([key, value]) => [key, { status: value.status, body: value.body }])),
  persistence: { status: persistence.status, sameId: persistence.body.id === id, lowercaseStatus: lowercase.status, missingStatus: missing.status },
  load: { requests: 100, ms: loadMs, statusCounts: loadResponses.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {}) },
  rate: { requests: 48, statusCounts, retryAfter },
}, null, 2));
