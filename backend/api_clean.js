/**
 * VINASTRA AEROSPACE — APPLICATION API & BUSINESS LOGIC
 * Complete REST API suite handling authentication, project management, tasks,
 * research workflows, engineering reviews, institutional collaboration, documents, and admin.
 */

import { db } from './db.js';
import { hashPassword, verifyPassword, signToken, generateRandomToken } from './crypto.js'
import {
  ROLES,
  mapRegistrationRole,
  authenticateRequest,
  hasRole,
  canAccessProject,
  canAccessDocument,
  logAuditEvent
} from './rbac.js';

// Response helpers
const sendJson = (response, status, payload, headers = {}) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...headers
  });
  response.end(JSON.stringify(payload));
};

const sendError = (response, status, message, details = null) => {
  sendJson(response, status, { error: message, ...(details ? { details } : {}) });
};

// Continue with rest of the file...
