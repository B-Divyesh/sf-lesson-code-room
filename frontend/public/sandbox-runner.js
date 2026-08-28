window.addEventListener('message', (event) => {
  if (event.source !== parent || !event.data || event.data.type !== 'lesson-code') return;
  const { html, css, javascript } = event.data;
  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; script-src blob:; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; media-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'";
  document.head.prepend(policy);
  document.body.innerHTML = String(html ?? '');
  const style = document.createElement('style');
  style.textContent = String(css ?? '');
  document.head.append(style);
  const source = new Blob([String(javascript ?? '')], { type: 'text/javascript' });
  const script = document.createElement('script');
  script.src = URL.createObjectURL(source);
  document.body.append(script);
});
