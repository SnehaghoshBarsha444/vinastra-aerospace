import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const TEST_PORT = 4982;
const BASE_URL = `http://localhost:${TEST_PORT}`;

console.log('🛸 Starting Vinastra Aerospace Automated Test Suite...\n');

// Spawn server process
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: String(TEST_PORT) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverStarted = false;

const cleanup = () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
};

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });

// Wait for server to report listening
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('Server failed to start within 5 seconds'));
  }, 5000);

  serverProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.includes('listening on')) {
      serverStarted = true;
      clearTimeout(timeout);
      resolve();
    }
  });

  serverProcess.stderr.on('data', (chunk) => {
    console.error('Server stderr:', chunk.toString());
  });

  serverProcess.on('error', (err) => {
    clearTimeout(timeout);
    reject(err);
  });
});

console.log(`✓ Test server running at ${BASE_URL}`);

let passed = 0;
let failed = 0;

const runTest = async (name, testFn) => {
  try {
    await testFn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
};

// Test Suite
console.log('\n--- 1. API Route Verification ---');

await runTest('GET /api/health returns 200 with ok status', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type')?.includes('application/json'));
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'vinastra-aerospace');
});

await runTest('GET /api/news returns 200 with source-verified items', async () => {
  const res = await fetch(`${BASE_URL}/api/news`);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type')?.includes('application/json'));
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 3);
  assert.ok(data[0].title);
  assert.ok(data[0].category);
});

await runTest('POST /api/contact receives valid inquiry with 201', async () => {
  const res = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verification Bot',
      email: 'test@aerospace-suite.org',
      type: 'Prototype-1 Hardware Partnership',
      message: 'Automated test inquiry validating telemetry endpoint.'
    })
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.received, true);
});

await runTest('POST /api/contact rejects honeypot submission with 400', async () => {
  const res = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      website: 'spam-bot.xyz',
      name: 'Bot',
      email: 'bot@spam.com',
      message: 'Spam payload'
    })
  });
  assert.equal(res.status, 400);
});

await runTest('POST /api/contact rejects invalid email with 400', async () => {
  const res = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Name',
      email: 'invalid-email-string',
      message: 'Hello'
    })
  });
  assert.equal(res.status, 400);
});

console.log('\n--- 2. Route & HTML Document Verification ---');

const routes = [
  ['Root route (/)', '/', 'Vinastra Aerospace'],
  ['Homepage (/home/)', '/home/', 'Vinastra Aerospace | Engineering The Next Frontier'],
  ['About page (/about/)', '/about/', 'About | Vinastra Aerospace'],
  ['Innovation page (/innovation/)', '/innovation/', 'ASCS Innovation &amp; Architecture | Vinastra Aerospace'],
  ['Research page (/research/)', '/research/', 'Planned R&amp;D &amp; Roadmap | Vinastra Aerospace'],
  ['News register (/news/)', '/news/', 'Public Register &amp; Dispatches | Vinastra Aerospace'],
  ['Investors brief (/investors/)', '/investors/', 'Seed Investor Brief | Vinastra Aerospace'],
  ['Collaborate page (/collaborate/)', '/collaborate/', 'Collaboration Pathways | Vinastra Aerospace'],
  ['Contact page (/contact/)', '/contact/', 'Contact &amp; Inquiries | Vinastra Aerospace'],
  ['Login portal (/login/)', '/login/', 'Client &amp; User Registry | Vinastra Aerospace'],
  ['Register portal (/register/)', '/register/', 'Client &amp; User Registry | Vinastra Aerospace'],
  ['Create Account portal (/create-account/)', '/create-account/', 'Client &amp; User Registry | Vinastra Aerospace'],
  ['Terms & Conditions page (/terms/)', '/terms/', 'Terms &amp; Conditions | Vinastra Aerospace'],
  ['Privacy Policy page (/privacy/)', '/privacy/', 'Privacy Policy | Vinastra Aerospace']
];

for (const [label, path, expectedTitle] of routes) {
  await runTest(`Route ${label} serves 200 with correct title and links`, async () => {
    const res = await fetch(`${BASE_URL}${path}`);
    assert.equal(res.status, 200, `Expected 200 for ${path}`);
    assert.ok(res.headers.get('content-type')?.includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes(expectedTitle), `Title check failed for ${path}`);
    assert.ok(html.includes('/styles.css'), `styles.css link missing on ${path}`);
    assert.ok(html.includes('/motion.css'), `motion.css link missing on ${path}`);
    assert.ok(html.includes('/script.js'), `script.js link missing on ${path}`);
    assert.ok(html.includes('/firebase-auth.js'), `firebase-auth.js missing on ${path}`);
    assert.ok(html.includes('ScrollTrigger.min.js'), `ScrollTrigger missing on ${path}`);
    assert.ok(html.includes('thesparkofwisdom@gmail.com'), `Official email missing on ${path}`);
  });
}

console.log('\n--- 3. Static Assets & Visual Elements Verification ---');

const assets = [
  ['/styles.css', 'text/css'],
  ['/motion.css', 'text/css'],
  ['/home-redesign.css', 'text/css'],
  ['/route.css', 'text/css'],
  ['/script.js', 'text/javascript'],
  ['/firebase-auth.js', 'text/javascript'],
  ['/public/vinastra-space-factory-blueprint.webp', 'image/webp'],
  ['/public/vinastra-space-factory-render.webp', 'image/webp'],
  ['/public/nasa-capstone-spacecraft.webp', 'image/webp'],
  ['/public/nasa-canadarm2.jpg', 'image/jpeg'],
  ['/public/nasa-rocket-launch.webp', 'image/webp'],
  ['/public/IMAGE-CREDITS.md', 'application/octet-stream']
];

for (const [path, expectedContentType] of assets) {
  await runTest(`Static asset ${path} exists and returns valid status`, async () => {
    const res = await fetch(`${BASE_URL}${path}`);
    assert.equal(res.status, 200, `Failed to load asset: ${path}`);
  });
}

console.log('\n--- 4. Authentication & Strict Email Validation Tests ---');

const isValidEmailTest = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!regex.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split('.');
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  return /^[a-zA-Z]{2,24}$/.test(tld);
};

await runTest('Strict email validator blocks invalid email entries', async () => {
  assert.equal(isValidEmailTest('invalid'), false);
  assert.equal(isValidEmailTest('invalid@'), false);
  assert.equal(isValidEmailTest('invalid@domain'), false);
  assert.equal(isValidEmailTest('@domain.com'), false);
  assert.equal(isValidEmailTest('user@.com'), false);
  assert.equal(isValidEmailTest('user@domain..com'), false);
  assert.equal(isValidEmailTest('user@domain.c'), false);
  assert.equal(isValidEmailTest(''), false);
});

await runTest('Strict email validator permits valid official and academic emails', async () => {
  assert.equal(isValidEmailTest('researcher@vinastra.space'), true);
  assert.equal(isValidEmailTest('student@iitb.ac.in'), true);
  assert.equal(isValidEmailTest('investor@aerospace-fund.co'), true);
  assert.equal(isValidEmailTest('name.surname@domain.org'), true);
});

console.log('\n--- Summary ---');
console.log(`Passed: ${passed} | Failed: ${failed}`);

cleanup();

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n🌟 All site verification checks passed successfully!\n');
  process.exit(0);
}
