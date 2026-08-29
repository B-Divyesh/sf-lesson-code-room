import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const recordedValidLicense = await readFile(new URL('./fixtures/recorded-valid-license.json', import.meta.url), 'utf8');

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:4180');
  if (url.pathname === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"ok":true}');
    return;
  }
  if (url.pathname === '/api/v1/products/lesson-code-room/verify' && url.searchParams.get('license') === 'recorded-room-plus-license') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(recordedValidLicense);
    return;
  }
  response.writeHead(404, { 'content-type': 'application/json' });
  response.end('{"valid":false,"reason":"invalid"}');
});

server.listen(4180, '127.0.0.1');
