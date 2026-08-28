window.addEventListener('message', (event) => {
  if (event.source !== parent || !event.data || event.data.type !== 'lesson-code') return;
  const { html, css, javascript } = event.data;
  document.body.innerHTML = String(html ?? '');
  const style = document.createElement('style');
  style.textContent = String(css ?? '');
  document.head.append(style);
  const source = new Blob([String(javascript ?? '')], { type: 'text/javascript' });
  const script = document.createElement('script');
  script.src = URL.createObjectURL(source);
  document.body.append(script);
});
