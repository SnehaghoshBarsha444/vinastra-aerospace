import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 4174;
const inquiryStore = path.join(root, 'data', 'inquiries.json');
// The public register carries only source-supported development statements.
// It intentionally avoids invented dates, launches, customers, or partnerships.
const stories = [
  { date: 'CURRENT', category: 'COMPANY STAGE', title: 'ASCS concept and development pathway', summary: 'VINASTRA is an early-stage company focused on concept development, engineering research, simulation, and planned prototype work.' },
  { date: 'PLANNED', category: 'PROTOTYPE-1', title: 'Ground-based demonstrator objective', summary: 'The proposed objective is to demonstrate blueprint-led assembly, inspection, and corrective workflows before any space mission.' },
  { date: 'OPEN', category: 'COLLABORATION', title: 'Research and technology conversations', summary: 'Universities, laboratories, agencies, and industry partners can discuss relevant work in robotics, simulation, sensors, and manufacturing.' }
];

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const readBody = async (request) => {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64 * 1024) throw new Error('Request body too large');
  }
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
<<<<<<< HEAD
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
=======
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
>>>>>>> 5e6f757 (Cinematic redesign, added graceful port fallback, updated script, added tests, converted missing asset, updated documentation)
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
      if (!request.headers['content-type']?.includes('application/json')) {
        return sendJson(response, 415, { error: 'JSON content type required' });
      }
      const inquiry = await readBody(request);
      const emailParts = String(inquiry.email || '').split('@');
      const hasValidEmail = emailParts.length === 2 && emailParts[0].length > 0 && emailParts[1].includes('.');
      if (inquiry.website || !inquiry.name || !inquiry.message || !hasValidEmail) {
        return sendJson(response, 400, { error: 'Name, email, and message are required' });
      }
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
<<<<<<< HEAD
  server.listen(port, () => console.log(`Vinastra Aerospace listening on http://localhost:${port}`));
=======
  let activePort = port;
  server.on('listening', () => {
    const addr = server.address();
    const actualPort = typeof addr === 'object' && addr ? addr.port : activePort;
    console.log(`Vinastra Aerospace listening on http://localhost:${actualPort}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      activePort += 1;
      console.warn(`Port ${activePort - 1} is currently in use. Falling back to port ${activePort}...`);
      server.listen(activePort);
    } else {
      throw err;
    }
  });
  server.listen(port);
>>>>>>> 5e6f757 (Cinematic redesign, added graceful port fallback, updated script, added tests, converted missing asset, updated documentation)
}

export default server;
