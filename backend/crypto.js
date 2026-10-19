/**
 * VINASTRA AEROSPACE — CRYPTOGRAPHIC UTILITIES
 * Enterprise-grade password hashing (PBKDF2-SHA512) and JWT/HMAC token handling.
 * Native node:crypto implementation with zero external dependencies.
 */

import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'vinastra_ascs_telemetry_secure_jwt_secret_key_2026_deeptech_orbit';
const DEFAULT_EXPIRY_MS = (Number(process.env.SESSION_EXPIRY_HOURS) || 24) * 60 * 60 * 1000;

/**
 * Hash a password using PBKDF2 with a cryptographically secure random salt
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') throw new Error('Password must be a valid string');
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a password against a stored PBKDF2 hash and salt
 */
export function verifyPassword(password, storedHash, storedSalt) {
  if (!password || !storedHash || !storedSalt) return false;
  try {
    const computedHash = crypto.pbkdf2Sync(password, storedSalt, 100000, 64, 'sha512').toString('hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch {
    return false;
  }
}

/**
 * Sign a URL-safe HMAC-SHA256 Token (Custom Lightweight JWT)
 */
export function signToken(payload, customExpiryMs = DEFAULT_EXPIRY_MS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + customExpiryMs;
  const fullPayload = { ...payload, exp, iat: Date.now() };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 Token
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically random secure token (e.g. for reset links, invitations)
 */
export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
