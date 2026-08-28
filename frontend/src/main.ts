import './styles.css';
import { ApiFailure, type Participant, type Progress, type Room, request } from './api';

const app = document.querySelector<HTMLDivElement>('#app')!;
const PRODUCT = 'lesson-code-room';
const BILLING_BASE = 'https://api.sociobot.in';
const VERSION = 'v1.0';
let cleanupRoute: (() => void) | undefined;

const starter = {
  title: 'Make a welcome card',
  instructions: 'Change the heading and button colors. Run the page, then mark yourself done.',
  html: `<main class="card">\n  <p class="label">Today’s exercise</p>\n  <h1>Hello, coders.</h1>\n  <button id="hello">Say hello</button>\n  <p id="message" aria-live="polite"></p>\n</main>`,
  css: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #102936;\n  color: #f7efd9;\n  font: 18px system-ui;\n}\n.card {\n  padding: 3rem;\n  border: 1px solid #3c6678;\n  background: #173543;\n}\n.label { color: #8cdcb3; }\nbutton {\n  min-height: 44px;\n  padding: .6rem 1rem;\n  border: 0;\n  background: #ffc857;\n  color: #201503;\n  font-weight: 700;\n}`,
  javascript: `document.querySelector('#hello').addEventListener('click', () => {\n  document.querySelector('#message').textContent = 'Hello received.';\n});`,
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function setMeta(title: string, description: string, path: string): void {
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://lesson-code-room.sociobot.in${path}`;
}

function header(): string {
  return `<a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header">
      <a class="wordmark" href="/" data-route aria-label="Lesson Code Room home">
        <span class="lamp-mark" aria-hidden="true"></span><span>Lesson Code Room</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/#create">Create a room</a>
        <a href="/demo" data-route>Demo</a>
        <a href="/privacy" data-route>Privacy</a>
      </nav>
    </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
    <p>One exercise room for the first minutes of a live lesson.</p>
    <div class="footer-links">
      <a href="/privacy" data-route>Privacy</a>
      <a href="/terms" data-route>Terms</a>
      <a href="https://hello-factory.sociobot.in" rel="noopener">Built by Param Factory <span class="sr-only">(external site)</span></a>
    </div>
    <p>${VERSION} · Original generated classroom art</p>
  </footer>`;
}

function shell(content: string, banner = ''): void {
  app.innerHTML = `${header()}${banner}${content}${footer()}<div id="route-announcer" class="sr-only" aria-live="polite"></div>`;
  bindNavigation();
}

function bindNavigation(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-route]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(new URL(link.href).pathname + new URL(link.href).search);
    });
  });
}

function navigate(path: string): void {
  history.pushState({}, '', path);
  void renderRoute(true);
}

function notify(message: string): void {
  const region = document.querySelector<HTMLElement>('#status-message');
  if (region) region.textContent = message;
}

function routeFocus(shouldFocus: boolean): void {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  const announcer = document.querySelector<HTMLElement>('#route-announcer');
  if (announcer) announcer.textContent = heading.textContent ?? '';
  if (shouldFocus) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

function landing(): void {
  setMeta('Lesson Code Room — Run a shared coding exercise', 'Open one HTML, CSS, and JavaScript exercise for a live lesson. Learners join without accounts and teachers see simple progress.', '/');
  shell(`<main id="main">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">One room. One exercise. Start teaching.</p>
        <h1>Run one coding exercise together</h1>
        <p class="hero-lead">For remote teachers who need learners coding now, with clear progress and no student accounts.</p>
        <div class="hero-action">
          <a class="button button-primary" href="/demo" data-route>Try it with sample data</a>
          <span>A sample room opens with three learners.</span>
        </div>
        <ul class="plain-facts" aria-label="Key facts">
          <li>No student accounts</li>
          <li>Rooms close after 24 hours</li>
          <li>Free for 10 learners</li>
        </ul>
      </div>
      <figure class="hero-art">
        <picture>
          <source media="(max-width: 700px)" srcset="/assets/classroom-hero-900.webp" />
          <img src="/assets/classroom-hero.webp" width="1536" height="1024" alt="A quiet coding classroom at dusk, with ten lit laptops facing a teacher desk." fetchpriority="high" decoding="async" />
        </picture>
        <figcaption>See the room, not private screens.</figcaption>
      </figure>
    </section>

    <section class="create-section" id="create" aria-labelledby="create-title">
      <div class="section-intro">
        <p class="eyebrow">The real first step</p>
        <h2 id="create-title">Set one exercise</h2>
        <p>Use the starter or paste your own HTML, CSS, and JavaScript. Learners each get an editable copy.</p>
      </div>
      <form id="create-form" class="creator-form">
        <div class="form-grid">
          <label>Exercise title<input name="title" maxlength="80" required value="${escapeHtml(starter.title)}" /></label>
          <label class="wide">Instructions<textarea name="instructions" maxlength="600" rows="3" required>${escapeHtml(starter.instructions)}</textarea></label>
        </div>
        ${editorFields(starter)}
        <div class="form-end">
          <button class="button button-primary" type="submit">Create room and join link</button>
          <p>Your room and starter code close after 24 hours.</p>
        </div>
        <p id="create-error" class="form-error" role="alert"></p>
      </form>
    </section>

    <section class="how-section" aria-labelledby="how-title">
      <div class="section-intro">
        <p class="eyebrow">A short teaching loop</p>
        <h2 id="how-title">How the room works</h2>
      </div>
      <ol class="steps">
        <li><span>01</span><h3>Create the exercise</h3><p>Set one task and starter page before the call.</p></li>
        <li><span>02</span><h3>Share one link</h3><p>Learners choose a screen name and start in their browser.</p></li>
        <li><span>03</span><h3>Watch simple progress</h3><p>See who joined, ran code, or marked the task done.</p></li>
      </ol>
    </section>

    <section class="limits-section" aria-labelledby="limits-title">
      <div>
        <p class="eyebrow">A room, not a watchtower</p>
        <h2 id="limits-title">Teach without surveillance</h2>
        <p>Teachers see screen names and three progress states. They do not see typing, tabs, cameras, or private learner code.</p>
      </div>
      <ul class="limits-list">
        <li>Runs HTML, CSS, and JavaScript only</li>
        <li>No grading or hidden activity reports</li>
        <li>No repositories or video calls</li>
      </ul>
    </section>

    <section class="paid-section" id="plus" aria-labelledby="plus-title">
      <div>
        <p class="eyebrow">For larger tutoring groups</p>
        <h2 id="plus-title">Room Plus: $29 once</h2>
        <p>Room Plus raises new rooms from 10 to 30 learners. The free room stays useful.</p>
      </div>
      <div class="license-panel">
        <a class="button button-primary" href="${BILLING_BASE}/api/v1/products/${PRODUCT}/checkout">Buy Room Plus</a>
        <button class="button button-quiet" id="restore-toggle" type="button" aria-expanded="false">Restore a license</button>
        <form id="license-form" class="license-form" hidden>
          <label>License token<input name="license" autocomplete="off" required /></label>
          <button class="button button-secondary" type="submit">Verify license</button>
        </form>
        <p id="license-status" class="small-note" role="status">One-time purchase. Sociobot is the merchant of record.</p>
      </div>
    </section>
  </main>`);
  bindCreateForm();
  bindLicenseUi();
}

function editorFields(values: typeof starter): string {
  return `<div class="code-inputs" aria-label="Starter code">
    <label><span>HTML</span><textarea name="html" rows="12" spellcheck="false">${escapeHtml(values.html)}</textarea></label>
    <label><span>CSS</span><textarea name="css" rows="12" spellcheck="false">${escapeHtml(values.css)}</textarea></label>
    <label><span>JavaScript</span><textarea name="javascript" rows="12" spellcheck="false">${escapeHtml(values.javascript)}</textarea></label>
  </div>`;
}

function bindCreateForm(): void {
  const form = document.querySelector<HTMLFormElement>('#create-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const error = form.querySelector<HTMLElement>('#create-error')!;
    button.disabled = true;
    button.textContent = 'Creating room…';
    error.textContent = '';
    const values = Object.fromEntries(new FormData(form));
    const license = getActiveLicense();
    try {
      const result = await request<{ room: Room; teacher_token: string; paid_capacity: boolean }>('/api/rooms', {
        method: 'POST', body: JSON.stringify({ ...values, license }),
      });
      sessionStorage.setItem(`teacher:${result.room.id}`, result.teacher_token);
      navigate(`/teach/${result.room.id}?teacher=${encodeURIComponent(result.teacher_token)}`);
    } catch (caught) {
      error.textContent = caught instanceof Error ? caught.message : 'The room could not be created. Try again.';
      button.disabled = false;
      button.textContent = 'Create room and join link';
    }
  });
}

function getActiveLicense(): string | undefined {
  const token = localStorage.getItem(`sb_license:${PRODUCT}`) ?? undefined;
  const cached = localStorage.getItem(`sb_license_verdict:${PRODUCT}`);
  if (!token || !cached) return undefined;
  try {
    const verdict = JSON.parse(cached) as { valid: boolean; checked_at: number };
    return verdict.valid ? token : undefined;
  } catch { return undefined; }
}

async function verifyLicense(token: string): Promise<boolean> {
  const response = await fetch(`${BILLING_BASE}/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) return false;
  const result = await response.json() as { valid: boolean };
  localStorage.setItem(`sb_license_verdict:${PRODUCT}`, JSON.stringify({ valid: result.valid, checked_at: Date.now() }));
  return result.valid;
}

function bindLicenseUi(): void {
  const toggle = document.querySelector<HTMLButtonElement>('#restore-toggle');
  const form = document.querySelector<HTMLFormElement>('#license-form');
  const status = document.querySelector<HTMLElement>('#license-status');
  if (!toggle || !form || !status) return;
  toggle.addEventListener('click', () => {
    const opens = form.hidden;
    form.hidden = !opens;
    toggle.setAttribute('aria-expanded', String(opens));
    if (opens) form.querySelector<HTMLInputElement>('input')?.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = String(new FormData(form).get('license') ?? '').trim();
    status.textContent = 'Checking this license…';
    try {
      const valid = await verifyLicense(token);
      if (valid) {
        localStorage.setItem(`sb_license:${PRODUCT}`, token);
        status.textContent = 'Room Plus is active. New rooms allow 30 learners.';
        form.hidden = true;
      } else {
        status.textContent = 'This license is not active. Check the token or buy Room Plus.';
      }
    } catch {
      status.textContent = 'The license service is unavailable. Try again when you are online.';
    }
  });
  void refreshCachedLicense(status);
}

async function refreshCachedLicense(status: HTMLElement): Promise<void> {
  const query = new URLSearchParams(location.search);
  const returned = query.get('license');
  if (returned) {
    localStorage.setItem(`sb_license:${PRODUCT}`, returned);
    query.delete('license');
    history.replaceState({}, '', `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`);
  }
  const token = localStorage.getItem(`sb_license:${PRODUCT}`);
  if (!token) return;
  const cached = localStorage.getItem(`sb_license_verdict:${PRODUCT}`);
  if (cached) {
    try {
      const verdict = JSON.parse(cached) as { valid: boolean; checked_at: number };
      if (verdict.valid) status.textContent = 'Room Plus is active. New rooms allow 30 learners.';
      if (Date.now() - verdict.checked_at < 86_400_000) return;
    } catch { /* check again */ }
  }
  try {
    const valid = await verifyLicense(token);
    status.textContent = valid ? 'Room Plus is active. New rooms allow 30 learners.' : 'This license is no longer active. Buy Room Plus to restore larger rooms.';
  } catch { /* keep the cached experience */ }
}

async function demoPage(): Promise<void> {
  setMeta('Demo — Lesson Code Room', 'Try a sample coding room with three learner progress states. Demo data is temporary and separate.', '/demo');
  shell(`<main id="main" class="loading-page"><h1>Opening the sample room</h1><div class="lamp-loader" aria-hidden="true"></div><p>This takes one short moment.</p></main>`, demoBanner());
  try {
    const result = await request<{ room: Room; teacher_token: string }>('/api/demo', { method: 'POST', body: '{}' });
    renderTeacher(result.room, result.teacher_token, true);
  } catch (caught) {
    renderErrorPage('The sample room did not open', caught instanceof Error ? caught.message : 'Try again.', '/demo', 'Reset demo');
  }
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" type="button">Reset demo</button><a href="/#create">Start for real</a></div></aside>`;
}

function bindDemoBanner(): void {
  document.querySelector('#reset-demo')?.addEventListener('click', () => void demoPage());
}

async function teacherPage(roomId: string): Promise<void> {
  const query = new URLSearchParams(location.search);
  const fromLink = query.get('teacher');
  if (fromLink) {
    sessionStorage.setItem(`teacher:${roomId}`, fromLink);
    history.replaceState({}, '', `/teach/${roomId}`);
  }
  const teacherToken = fromLink ?? sessionStorage.getItem(`teacher:${roomId}`);
  if (!teacherToken) {
    renderErrorPage('This teacher link is incomplete', 'Open the private teacher link created with the room.', '/', 'Create another room');
    return;
  }
  try {
    const room = await request<Room>(`/api/rooms/${roomId}`);
    renderTeacher(room, teacherToken, false);
  } catch (caught) {
    renderErrorPage('This room is unavailable', caught instanceof Error ? caught.message : 'Check the link.', '/', 'Create another room');
  }
}

function renderTeacher(room: Room, teacherToken: string, demo: boolean): void {
  setMeta(`${demo ? 'Demo' : 'Teach'} — Lesson Code Room`, `See learner progress for ${room.title}.`, demo ? '/demo' : `/teach/${room.id}`);
  const joinUrl = `${location.origin}/room/${room.id}`;
  shell(`<main id="main" class="teacher-page">
    <section class="teacher-heading">
      <div>
        <p class="eyebrow">Teacher view · room ${room.id}</p>
        <h1>${escapeHtml(room.title)}</h1>
        <p>${escapeHtml(room.instructions)}</p>
      </div>
      <div class="join-link-panel">
        <span>Share this learner link</span>
        <div><input id="join-link" value="${escapeHtml(joinUrl)}" readonly aria-label="Learner join link" /><button class="button button-primary" id="copy-link" type="button">Copy join link</button></div>
        <small>Keep this teacher page private.</small>
      </div>
    </section>
    <section class="signal-board" aria-labelledby="signals-title">
      <div class="signal-heading">
        <div><p class="eyebrow">Live signals</p><h2 id="signals-title">Learner progress</h2></div>
        <p id="last-updated" aria-live="polite">Checking the room…</p>
      </div>
      <div class="count-strip" aria-label="Progress totals">
        <div><strong id="count-total">0</strong><span>in room</span></div>
        <div><strong id="count-ran">0</strong><span>ran code</span></div>
        <div><strong id="count-done">0</strong><span>done</span></div>
        <div><strong>${room.capacity}</strong><span>room limit</span></div>
      </div>
      <div id="participants" class="participant-list" aria-live="polite"><p class="empty-state">No learners yet. Share the learner link to fill this list.</p></div>
    </section>
    <section class="teacher-preview" aria-labelledby="preview-title">
      <div><p class="eyebrow">Starter page</p><h2 id="preview-title">What learners receive</h2></div>
      <iframe title="Starter exercise preview" sandbox="allow-scripts"></iframe>
    </section>
  </main>`, demo ? demoBanner() : '');
  bindDemoBanner();
  const preview = document.querySelector<HTMLIFrameElement>('.teacher-preview iframe')!;
  loadSandbox(preview, room.html, room.css, room.javascript);
  document.querySelector('#copy-link')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      const button = document.querySelector<HTMLButtonElement>('#copy-link')!;
      button.textContent = 'Copied join link';
      notify('Learner join link copied.');
    } catch {
      const input = document.querySelector<HTMLInputElement>('#join-link')!;
      input.select();
      notify('Copy the selected learner link.');
    }
  });
  let active = true;
  const update = async () => {
    try {
      const progress = await request<Progress>(`/api/rooms/${room.id}/progress?teacher_token=${encodeURIComponent(teacherToken)}`);
      if (active) updateParticipants(progress);
    } catch (caught) {
      const updated = document.querySelector<HTMLElement>('#last-updated');
      if (updated) updated.textContent = caught instanceof Error ? caught.message : 'Progress could not be updated.';
    }
  };
  void update();
  const timer = window.setInterval(() => { if (!document.hidden) void update(); }, 2500);
  cleanupRoute = () => { active = false; window.clearInterval(timer); };
}

function updateParticipants(progress: Progress): void {
  document.querySelector('#count-total')!.textContent = String(progress.participants.length);
  document.querySelector('#count-ran')!.textContent = String(progress.counts.ran + progress.counts.done);
  document.querySelector('#count-done')!.textContent = String(progress.counts.done);
  document.querySelector('#last-updated')!.textContent = 'Progress updated just now';
  const list = document.querySelector<HTMLElement>('#participants')!;
  if (!progress.participants.length) {
    list.innerHTML = '<p class="empty-state">No learners yet. Share the learner link to fill this list.</p>';
    return;
  }
  list.innerHTML = progress.participants.map((participant) => `<div class="participant">
    <span class="signal-dot signal-${participant.status}" aria-hidden="true"></span>
    <strong>${escapeHtml(participant.name)}</strong>
    <span>${statusLabel(participant.status)}</span>
  </div>`).join('');
}

function statusLabel(status: Participant['status']): string {
  return status === 'joined' ? 'Joined' : status === 'ran' ? 'Ran code' : 'Done';
}

async function roomPage(roomId: string): Promise<void> {
  setMeta('Join a room — Lesson Code Room', 'Join a live HTML, CSS, and JavaScript exercise without an account.', `/room/${roomId}`);
  shell(`<main id="main" class="loading-page"><h1>Opening room ${escapeHtml(roomId)}</h1><div class="lamp-loader" aria-hidden="true"></div><p>Loading the starter exercise.</p></main>`);
  try {
    const room = await request<Room>(`/api/rooms/${roomId}`);
    const saved = sessionStorage.getItem(`learner:${room.id}`);
    if (saved) {
      const session = JSON.parse(saved) as { learner_token: string; name: string };
      renderWorkbench(room, session.learner_token, session.name);
    } else renderJoin(room);
  } catch (caught) {
    renderErrorPage('This room is unavailable', caught instanceof Error ? caught.message : 'Check the room code.', '/', 'Return home');
  }
}

function renderJoin(room: Room): void {
  setMeta(`Join ${room.title} — Lesson Code Room`, `Choose a screen name and join ${room.title}.`, `/room/${room.id}`);
  shell(`<main id="main" class="join-page">
    <section class="join-card">
      <p class="eyebrow">Room ${room.id}</p>
      <h1>Join ${escapeHtml(room.title)}</h1>
      <p>${escapeHtml(room.instructions)}</p>
      <form id="join-form">
        <label>Screen name<input name="name" maxlength="24" autocomplete="nickname" required /></label>
        <p class="field-help">Use any name your teacher will recognize. No account is made.</p>
        <button class="button button-primary" type="submit">Join the exercise</button>
        <button class="button button-quiet" id="random-name" type="button">Use a random name</button>
        <p id="join-error" class="form-error" role="alert"></p>
      </form>
    </section>
  </main>`);
  const form = document.querySelector<HTMLFormElement>('#join-form')!;
  const input = form.elements.namedItem('name') as HTMLInputElement;
  document.querySelector('#random-name')?.addEventListener('click', () => {
    const first = ['Blue', 'Quiet', 'Bright', 'Kind', 'Swift'];
    const second = ['Comet', 'Fox', 'Finch', 'Moth', 'Otter'];
    input.value = `${first[Math.floor(Math.random() * first.length)]} ${second[Math.floor(Math.random() * second.length)]}`;
    input.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const error = document.querySelector<HTMLElement>('#join-error')!;
    button.disabled = true;
    button.textContent = 'Joining exercise…';
    try {
      const joined = await request<{ learner_token: string; participant: Participant }>(`/api/rooms/${room.id}/join`, { method: 'POST', body: JSON.stringify({ name: input.value }) });
      sessionStorage.setItem(`learner:${room.id}`, JSON.stringify({ learner_token: joined.learner_token, name: joined.participant.name }));
      renderWorkbench(room, joined.learner_token, joined.participant.name);
    } catch (caught) {
      error.textContent = caught instanceof Error ? caught.message : 'The room could not be joined. Try again.';
      button.disabled = false;
      button.textContent = 'Join the exercise';
    }
  });
}

function renderWorkbench(room: Room, learnerToken: string, name: string): void {
  setMeta(`${room.title} — Lesson Code Room`, `Edit and run the ${room.title} exercise.`, `/room/${room.id}`);
  shell(`<main id="main" class="workbench-page">
    <section class="workbench-heading">
      <div><p class="eyebrow">Room ${room.id} · ${escapeHtml(name)}</p><h1>${escapeHtml(room.title)}</h1><p>${escapeHtml(room.instructions)}</p></div>
      <div class="workbench-actions">
        <button class="button button-primary" id="run-code" type="button">Run the page</button>
        <button class="button button-secondary" id="mark-done" type="button">Mark as done</button>
        <button class="button button-quiet" id="reset-code" type="button">Reset starter code</button>
      </div>
    </section>
    <div id="offline-note" class="offline-note" role="status" hidden>You are offline. Editing and preview still work. Progress will update after you reconnect.</div>
    <section class="workbench" aria-label="Coding workbench">
      <div class="editor-pane">
        <div class="editor-tabs" role="tablist" aria-label="Code files">
          <button role="tab" aria-selected="true" aria-controls="html-editor" id="tab-html" data-tab="html">HTML</button>
          <button role="tab" aria-selected="false" aria-controls="css-editor" id="tab-css" data-tab="css">CSS</button>
          <button role="tab" aria-selected="false" aria-controls="js-editor" id="tab-js" data-tab="js">JavaScript</button>
        </div>
        <div class="editor-fields">
          <label id="html-editor" role="tabpanel" aria-labelledby="tab-html">HTML<textarea data-code="html" spellcheck="false">${escapeHtml(room.html)}</textarea></label>
          <label id="css-editor" role="tabpanel" aria-labelledby="tab-css" hidden>CSS<textarea data-code="css" spellcheck="false">${escapeHtml(room.css)}</textarea></label>
          <label id="js-editor" role="tabpanel" aria-labelledby="tab-js" hidden>JavaScript<textarea data-code="javascript" spellcheck="false">${escapeHtml(room.javascript)}</textarea></label>
        </div>
      </div>
      <div class="preview-pane">
        <div class="preview-bar"><span>Preview</span><span id="run-status" role="status">Starter ready</span></div>
        <iframe id="result-frame" title="Your exercise preview" sandbox="allow-scripts"></iframe>
      </div>
    </section>
  </main>`);
  const original = { html: room.html, css: room.css, javascript: room.javascript };
  const fields = () => ({
    html: document.querySelector<HTMLTextAreaElement>('[data-code="html"]')!.value,
    css: document.querySelector<HTMLTextAreaElement>('[data-code="css"]')!.value,
    javascript: document.querySelector<HTMLTextAreaElement>('[data-code="javascript"]')!.value,
  });
  const iframe = document.querySelector<HTMLIFrameElement>('#result-frame')!;
  const runStatus = document.querySelector<HTMLElement>('#run-status')!;
  const run = async () => {
    const code = fields();
    loadSandbox(iframe, code.html, code.css, code.javascript);
    runStatus.textContent = 'Page ran just now';
    await sendProgress(room.id, learnerToken, 'ran', runStatus);
  };
  document.querySelector('#run-code')?.addEventListener('click', () => void run());
  document.querySelector('#mark-done')?.addEventListener('click', async () => {
    await sendProgress(room.id, learnerToken, 'done', runStatus);
    document.querySelector<HTMLButtonElement>('#mark-done')!.textContent = 'Marked as done';
  });
  document.querySelector('#reset-code')?.addEventListener('click', () => {
    if (!confirm('Reset all three files to the teacher’s starter code? Your edits will be replaced.')) return;
    document.querySelector<HTMLTextAreaElement>('[data-code="html"]')!.value = original.html;
    document.querySelector<HTMLTextAreaElement>('[data-code="css"]')!.value = original.css;
    document.querySelector<HTMLTextAreaElement>('[data-code="javascript"]')!.value = original.javascript;
    loadSandbox(iframe, original.html, original.css, original.javascript);
    runStatus.textContent = 'Starter code restored';
  });
  bindTabs();
  bindOfflineState();
  loadSandbox(iframe, room.html, room.css, room.javascript);
}

function bindTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const activate = (tab: HTMLButtonElement) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')!)!.hidden = !active;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      activate(next); next.focus();
    });
  });
}

function bindOfflineState(): void {
  const note = document.querySelector<HTMLElement>('#offline-note');
  if (!note) return;
  const sync = () => { note.hidden = navigator.onLine; };
  sync();
  window.addEventListener('online', sync, { once: true });
  window.addEventListener('offline', sync, { once: true });
}

async function sendProgress(roomId: string, token: string, status: 'ran' | 'done', output: HTMLElement): Promise<void> {
  try {
    await request(`/api/rooms/${roomId}/progress`, { method: 'POST', body: JSON.stringify({ learner_token: token, status }) });
    output.textContent = status === 'done' ? 'Teacher can see: Done' : 'Teacher can see: Ran code';
  } catch (caught) {
    output.textContent = caught instanceof ApiFailure && caught.code === 'offline' ? 'Preview ran. Progress is waiting for a connection.' : caught instanceof Error ? caught.message : 'Progress did not update.';
  }
}

function loadSandbox(frame: HTMLIFrameElement, html: string, css: string, javascript: string): void {
  frame.addEventListener('load', () => {
    frame.contentWindow?.postMessage({ type: 'lesson-code', html, css, javascript }, '*');
  }, { once: true });
  frame.src = `/sandbox.html#${Date.now()}`;
}

function legalPage(kind: 'privacy' | 'terms'): void {
  if (kind === 'privacy') {
    setMeta('Privacy — Lesson Code Room', 'How Lesson Code Room stores short-lived room and learner progress data.', '/privacy');
    shell(`<main id="main" class="prose-page"><p class="eyebrow">Plain-language policy · 28 August 2026</p><h1>Privacy without a student account</h1>
      <h2>What the room stores</h2><p>A room stores its title, instructions, starter code, and a random teacher key. It also stores each learner’s chosen screen name and progress state.</p>
      <h2>What stays in the browser</h2><p>Learner edits stay in that learner’s browser. Running code does not send those edits to our server.</p>
      <h2>When data is removed</h2><p>Live rooms expire after 24 hours. Demo rooms expire after two hours. Expired room data is deleted during normal server cleanup.</p>
      <h2>Payments</h2><p>Sociobot is the merchant of record for Room Plus. This site stores a license token and its latest result in your browser. Payment card details never reach Lesson Code Room.</p>
      <h2>What we do not collect</h2><p>We do not use advertising trackers. We do not collect student email addresses, cameras, keystrokes, open tabs, or code changes.</p>
      <h2>Questions</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a room code if you need help.</p>
    </main>`);
  } else {
    setMeta('Terms — Lesson Code Room', 'Terms for using Lesson Code Room and buying the one-time Room Plus license.', '/terms');
    shell(`<main id="main" class="prose-page"><p class="eyebrow">Plain-language terms · 28 August 2026</p><h1>Terms for using a lesson room</h1>
      <h2>Use the room for teaching</h2><p>You may use the service for lawful HTML, CSS, and JavaScript lessons. Do not use it to harm systems, invade privacy, or monitor learners.</p>
      <h2>Keep the teacher link private</h2><p>Anyone with the teacher link can see learner screen names and progress. The teacher is responsible for sharing it carefully.</p>
      <h2>Short-lived service</h2><p>Rooms are temporary and may be removed after they expire. Keep your own copy of starter code that matters.</p>
      <h2>Room Plus</h2><p>Room Plus costs $29 as a one-time purchase and raises the room limit to 30 learners. Sociobot is the merchant of record. Its checkout handles receipts and refunds. A refunded or revoked license stops opening larger rooms.</p>
      <h2>Service limits</h2><p>The service is provided without a promise of uninterrupted access. We may block abuse or unsafe use.</p>
    </main>`);
  }
}

function renderErrorPage(title: string, message: string, href: string, action: string): void {
  setMeta(`Not found — Lesson Code Room`, 'The requested lesson room or page could not be opened.', location.pathname);
  shell(`<main id="main" class="error-page"><div class="door-number">404</div><p class="eyebrow">The classroom is dark</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a class="button button-primary" href="${href}" data-route>${escapeHtml(action)}</a></main>`);
}

async function renderRoute(shouldFocus = false): Promise<void> {
  cleanupRoute?.(); cleanupRoute = undefined;
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') landing();
  else if (path === '/demo') await demoPage();
  else if (path === '/privacy') legalPage('privacy');
  else if (path === '/terms') legalPage('terms');
  else if (path.startsWith('/teach/')) await teacherPage(path.split('/')[2].toUpperCase());
  else if (path.startsWith('/room/')) await roomPage(path.split('/')[2].toUpperCase());
  else renderErrorPage('This page is not in the room', 'Check the address or return to the lesson room home.', '/', 'Return home');
  routeFocus(shouldFocus);
}

window.addEventListener('popstate', () => void renderRoute(true));
void renderRoute();
