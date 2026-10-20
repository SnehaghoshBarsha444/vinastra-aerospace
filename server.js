/**
 * VINASTRA AEROSPACE — PRODUCTION SERVER & GATEWAY
 * Integrates Mission Control APIs, RBAC authentication, and secure static asset delivery.
 */

import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './backend/api.js';
import { initializeFirestoreSync } from './src/lib/firebase/firestore-sync.js';
import { db } from './backend/db.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 4174;

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(payload));
};

const readBody = async (request) => {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 512 * 1024) throw new Error('Request body too large'); // 512KB limit
  }
  return JSON.parse(body || '{}');
};

const serveFile = async (request, response, pathname) => {
  // Security: Disallow serving data directory or hidden files
  if (
    pathname.startsWith('/data/') ||
    pathname.startsWith('/.git') ||
    pathname.startsWith('/.env') ||
    pathname.includes('..')
  ) {
    return sendJson(response, 403, { error: 'Access to internal system files is forbidden' });
  }

  let requested = pathname;
  if (pathname === '/') requested = '/index.html';
  if (pathname.endsWith('/')) requested = `${pathname}index.html`;

  // Clean trailing URLs without trailing slash (e.g. /mission-control -> /mission-control/index.html)
  if (requested === '/mission-control') requested = '/mission-control/index.html';
  if (requested === '/mission-control/admin') requested = '/mission-control/admin/index.html';

  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) return sendJson(response, 403, { error: 'Forbidden' });

  try {
    const stats = await fs.stat(filePath);
    let finalPath = filePath;
    if (stats.isDirectory()) {
      finalPath = path.join(filePath, 'index.html');
    }

    const content = await fs.readFile(finalPath);
    const extension = path.extname(finalPath);
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.webmanifest': 'application/manifest+json',
      '.mp4': 'video/mp4',
      '.pdf': 'application/pdf'
    };

    response.writeHead(200, {
      'Content-Type': types[extension] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: 'Not found' });
  }
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  // Route API requests through backend API dispatcher
  if (url.pathname.startsWith('/api/')) {
    try {
      let body = {};
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = await readBody(request);
        } else {
          // If content type is not JSON for POST /api/contact, check header for contract parity
          if (url.pathname === '/api/contact' && !contentType.includes('application/json')) {
            return sendJson(response, 415, { error: 'JSON content type required' });
          }
        }
      }
      return await handleApiRequest(request, response, url, body);
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(response, 400, { error: err.message || 'Invalid request' });
    }
  }

  // Serve static files
  return serveFile(request, response, url.pathname);
});

if (process.env.VERCEL !== '1') {
  let activePort = port;
  server.on('listening', async () => {
    const addr = server.address();
    const actualPort = typeof addr === 'object' && addr ? addr.port : activePort;
    console.log(`Vinastra Aerospace listening on http://localhost:${actualPort}`);
    
    // Initialize Firestore sync after server starts
    try {
      await db.init();
      const syncResult = await initializeFirestoreSync(db, {
        enableRealtimeSync: true,
        syncIntervalMs: 60000, // Sync every 60 seconds
        syncOnStartup: true
      });
      if (syncResult.success) {
        console.log('[Server] Firestore real-time sync enabled');
      } else {
        console.log('[Server] Firestore sync disabled:', syncResult.reason || syncResult.error);
      }
    } catch (error) {
      console.log('[Server] Firestore sync initialization skipped:', error.message);
    }
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
}

export default server;
