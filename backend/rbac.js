/**
 * VINASTRA AEROSPACE — ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENGINE
 * Enforces server-side authentication, authorization boundaries, and university isolation.
 */

import { verifyToken } from './crypto.js';
import { db } from './db.js';

export const ROLES = {
  ADMIN: 'ADMIN',
  FOUNDER: 'FOUNDER',
  ENGINEER: 'ENGINEER',
  RESEARCHER: 'RESEARCHER',
  STUDENT: 'STUDENT',
  INVESTOR: 'INVESTOR'
};

// Map registration form role string to internal system role
export function mapRegistrationRole(clientRole) {
  switch (clientRole?.toLowerCase()) {
    case 'students':
    case 'student':
      return ROLES.STUDENT;
    case 'researcher':
    case 'academic':
      return ROLES.RESEARCHER;
    case 'professional':
    case 'engineer':
      return ROLES.ENGINEER;
    case 'investor':
      return ROLES.INVESTOR;
    default:
      return ROLES.STUDENT; // Default safe unprivileged role
  }
}

/**
 * Extract auth token from Authorization Header or Cookie
 */
export function extractToken(request) {
  const authHeader = request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // Check cookie
  const cookieHeader = request.headers['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/vinastra_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Authenticate request and attach user object
 */
export async function authenticateRequest(request) {
  const token = extractToken(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.uid) return null;

  await db.init();
  const user = db.collection('users').findById(payload.uid);
  if (!user || user.status === 'SUSPENDED') return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId,
    department: user.department,
    status: user.status
  };
}

/**
 * Check if user has one of the allowed roles
 */
export function hasRole(user, allowedRoles) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.FOUNDER) return true; // Superusers
  return allowedRoles.includes(user.role);
}

/**
 * Check if user can access a specific project
 */
export async function canAccessProject(user, project) {
  if (!user || !project) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.FOUNDER) return true;

  // Investor access: ONLY public or high-level investor-safe projects
  if (user.role === ROLES.INVESTOR) {
    return project.confidentialityLevel === 'PUBLIC' || project.confidentialityLevel === 'INVESTOR_SAFE';
  }

  // Check explicit project membership
  const member = db.collection('projectMembers').findOne((pm) => pm.projectId === project.id && pm.userId === user.id);
  if (member) return true;

  // Institutional isolation: Institutional projects only visible to members of that institution
  if (project.confidentialityLevel === 'INSTITUTIONAL' && project.institutionId === user.institutionId) {
    return true;
  }

  // General engineers can view internal engineering projects
  if (user.role === ROLES.ENGINEER && project.confidentialityLevel === 'INTERNAL') {
    return true;
  }

  return false;
}

/**
 * Check if user can access a specific document
 */
export async function canAccessDocument(user, doc) {
  if (!user || !doc) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.FOUNDER) return true;

  // Public document
  if (doc.accessLevel === 'PUBLIC') return true;

  // Investor safe documents
  if (doc.accessLevel === 'INVESTOR_SAFE' && user.role === ROLES.INVESTOR) return true;

  // Investors CANNOT access proprietary CAD, internal engineering, or institutional research
  if (user.role === ROLES.INVESTOR) return false;

  // Uploader can always access
  if (doc.uploadedByUserId === user.id) return true;

  // Institutional boundary
  if (doc.accessLevel === 'INSTITUTIONAL') {
    return doc.institutionId === user.institutionId;
  }

  // Internal confidential: Accessible to engineers and researchers assigned to the project
  if (doc.accessLevel === 'INTERNAL_CONFIDENTIAL') {
    if (user.role === ROLES.ENGINEER) return true;
    if (doc.projectId) {
      const isMember = db.collection('projectMembers').findOne((pm) => pm.projectId === doc.projectId && pm.userId === user.id);
      return !!isMember;
    }
  }

  return false;
}

/**
 * Audit log helper
 */
export async function logAuditEvent({ userId, action, resourceType, resourceId, details, request }) {
  try {
    await db.init();
    const ipAddress = request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = request?.headers['user-agent'] || 'Unknown';

    await db.collection('auditLogs').insert({
      userId: userId || 'ANONYMOUS',
      action,
      resourceType,
      resourceId: String(resourceId || ''),
      ipAddress: String(ipAddress),
      userAgent: String(userAgent).slice(0, 200),
      details: String(details || ''),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}
