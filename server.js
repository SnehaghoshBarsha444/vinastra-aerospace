import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 4174;
const inquiryStore = path.join(root, 'data', 'inquiries.json');
const stories = [
  { date: '12.09.24', category: 'RESEARCH UPDATE', title: 'Building for the long duration', summary: 'Why orbital infrastructure begins with systems designed to last.' },
  { date: '04.08.24', category: 'COMPANY NEWS', title: 'Vinastra Aerospace begins its next chapter', summary: 'A new R&D platform for the emerging space economy.' },
  { date: '21.06.24', category: 'TECHNOLOGY', title: 'Autonomy at the edge of operation', summary: 'Exploring the role of intelligent systems beyond the human reach.' }
];

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const readBody = async (request) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  return JSON.parse(body || '{}');
};

const serveFile = async (request, response, pathname) => {
  let requested = pathname;
  if (pathname === '/') requested = '/index.html';
  if (pathname.endsWith('/')) requested = `${pathname}index.html`;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) return sendJson(response, 403, { error: 'Forbidden' });
  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
    response.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream' });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: 'Not found' });
  }
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/api/health' && request.method === 'GET') return sendJson(response, 200, { status: 'ok', service: 'vinastra-aerospace' });
  if (url.pathname === '/api/news' && request.method === 'GET') return sendJson(response, 200, stories);
  if (url.pathname === '/api/contact' && request.method === 'POST') {
    try {
      const inquiry = await readBody(request);
      const emailParts = String(inquiry.email || '').split('@');
      const hasValidEmail = emailParts.length === 2 && emailParts[0].length > 0 && emailParts[1].includes('.');
      if (!inquiry.name || !hasValidEmail) return sendJson(response, 400, { error: 'Name and valid email are required' });
      await fs.mkdir(path.dirname(inquiryStore), { recursive: true });
      let entries = [];
      try { entries = JSON.parse(await fs.readFile(inquiryStore, 'utf8')); } catch {}
      entries.push({ id: crypto.randomUUID(), ...inquiry, receivedAt: new Date().toISOString() });
      await fs.writeFile(inquiryStore, JSON.stringify(entries, null, 2));
      return sendJson(response, 201, { received: true });
    } catch { return sendJson(response, 400, { error: 'Invalid request' }); }
  }
  return serveFile(request, response, url.pathname);
});

if (process.env.VERCEL !== '1') {
  server.listen(port, () => console.log(`Vinastra Aerospace listening on http://localhost:${port}`));
}

export default server;