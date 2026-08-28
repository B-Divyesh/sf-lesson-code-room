window.addEventListener('message', (event) => {
  if (event.source !== parent || !event.data || event.data.type !== 'lesson-code') return;
  const { html, css, javascript, runId } = event.data;
  const reportError = (error) => {
    const message = error instanceof Error ? error.message : String(error || 'Check the JavaScript and try again.');
    parent.postMessage({ type: 'lesson-code-error', runId, message }, location.origin);
  };
  window.addEventListener('error', (error) => {
    reportError(error.error || error.message);
    error.preventDefault();
  }, { once: true });
  window.addEventListener('unhandledrejection', (error) => {
    reportError(error.reason);
    error.preventDefault();
  }, { once: true });
  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; script-src blob:; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; media-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'";
  document.head.prepend(policy);
  document.querySelectorAll('[data-preview-resource]').forEach((element) => element.remove());
  document.body.innerHTML = String(html ?? '');
  const style = document.createElement('style');
  style.dataset.previewResource = '';
  style.textContent = String(css ?? '');
  document.head.append(style);
  const source = new Blob([String(javascript ?? '')], { type: 'text/javascript' });
  const script = document.createElement('script');
  const sourceUrl = URL.createObjectURL(source);
  script.dataset.previewResource = '';
  script.type = 'module';
  script.src = sourceUrl;
  script.addEventListener('load', () => {
    URL.revokeObjectURL(sourceUrl);
    parent.postMessage({ type: 'lesson-code-ready', runId }, location.origin);
  }, { once: true });
  script.addEventListener('error', () => {
    URL.revokeObjectURL(sourceUrl);
    reportError('Check the JavaScript and try again.');
  }, { once: true });
  document.body.append(script);
});
