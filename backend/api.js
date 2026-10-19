/**
 * VINASTRA AEROSPACE — APPLICATION API & BUSINESS LOGIC
 * Complete REST API suite handling authentication, project management, tasks,
 * research workflows, engineering reviews, institutional collaboration, documents, and admin.
 */

import { db } from './db.js';
import { hashPassword, verifyPassword, signToken, generateRandomToken } from './crypto.js';
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

// Strict email regex matching test suite
function isValidEmail(email) {
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
}

// In-memory rate limiter
const rateLimits = new Map();
function checkRateLimit(ip, endpoint, maxHits = 30, windowMs = 60000) {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimits.get(key) || { hits: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.hits = 0;
    entry.resetAt = now + windowMs;
  }

  entry.hits += 1;
  rateLimits.set(key, entry);
  return entry.hits <= maxHits;
}

/**
 * Main API Request Dispatcher
 */
export async function handleApiRequest(request, response, url, body) {
  await db.init();

  const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || '127.0.0.1';
  const method = request.method;
  const pathname = url.pathname;

  // Rate limit sensitive endpoints (auth & contact)
  if (pathname.startsWith('/api/auth/') || pathname === '/api/contact') {
    if (!checkRateLimit(ip, pathname, 25, 60000)) {
      return sendError(response, 429, 'Rate limit exceeded. Please wait before retrying.');
    }
  }

  // Authenticate user if token is present
  const user = await authenticateRequest(request);

  // -------------------------------------------------------------
  // 1. PUBLIC ENDPOINTS
  // -------------------------------------------------------------

  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(response, 200, {
      status: 'ok',
      service: 'vinastra-aerospace',
      timestamp: new Date().toISOString(),
      engine: 'ASCS-Node20-ESM'
    });
  }

  if (pathname === '/api/news' && method === 'GET') {
    const announcements = db.collection('announcements').find();
    const stories = [
      {
        date: 'CURRENT',
        category: 'COMPANY STAGE',
        title: 'ASCS concept and development pathway',
        summary: 'VINASTRA is an early-stage company focused on concept development, engineering research, simulation, and planned prototype work.'
      },
      {
        date: 'PLANNED',
        category: 'PROTOTYPE-1',
        title: 'Ground-based demonstrator objective',
        summary: 'The proposed objective is to demonstrate blueprint-led assembly, inspection, and corrective workflows before any space mission.'
      },
      {
        date: 'OPEN',
        category: 'COLLABORATION',
        title: 'Research and technology conversations',
        summary: 'Universities, laboratories, agencies, and industry partners can discuss relevant work in robotics, simulation, sensors, and manufacturing.'
      }
    ];
    return sendJson(response, 200, stories);
  }

  if (pathname === '/api/contact' && method === 'POST') {
    const { name, email, type, message, website } = body || {};
    const emailParts = String(email || '').split('@');
    const hasValidEmail = emailParts.length === 2 && emailParts[0].length > 0 && emailParts[1].includes('.');

    if (website || !name || !message || !hasValidEmail) {
      return sendError(response, 400, 'Name, email, and message are required');
    }

    const inquiry = await db.collection('inquiries').insert({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      type: String(type || 'General Inquiry'),
      message: String(message).trim(),
      receivedAt: new Date().toISOString()
    });

    await logAuditEvent({
      userId: user?.id || null,
      action: 'CONTACT_INQUIRY_RECEIVED',
      resourceType: 'INQUIRY',
      resourceId: inquiry.id,
      details: `Inquiry received from ${email} (${type})`,
      request
    });

    return sendJson(response, 201, { received: true, id: inquiry.id });
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & IDENTITY MANAGEMENT
  // -------------------------------------------------------------

  if (pathname === '/api/auth/register' && method === 'POST') {
    const { name, email, password, role, institutionCode, department } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(response, 400, 'Full name is required.');
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return sendError(response, 400, 'Invalid email address. Please provide a valid email format.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendError(response, 400, 'Password must be at least 6 characters.');
    }

    // Check if email already registered
    const existing = db.collection('users').findOne((u) => u.email === cleanEmail);
    if (existing) {
      return sendError(response, 409, 'An account with this email already exists.');
    }

    // Map role safely (students, researcher, professional, investor)
    // CRITICAL SECURITY RULE: Self-assigned role NEVER grants ADMIN or FOUNDER
    const assignedRole = mapRegistrationRole(role);

    // Check institution association if provided
    let institutionId = null;
    if (institutionCode) {
      const inst = db.collection('institutions').findOne((i) => i.code === institutionCode || i.id === institutionCode);
      if (inst) institutionId = inst.id;
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    const newUser = await db.collection('users').insert({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hash,
      salt: salt,
      role: assignedRole,
      institutionId: institutionId,
      department: department ? String(department).trim() : null,
      status: 'ACTIVE',
      emailVerified: true, // Simulation / pre-verified in prototype
      createdAt: now,
      updatedAt: now
    });

    const token = signToken({ uid: newUser.id, role: newUser.role });

    await logAuditEvent({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: newUser.id,
      details: `User registered with role ${newUser.role}`,
      request
    });

    const cookieHeader = `vinastra_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
    return sendJson(
      response,
      201,
      {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          institutionId: newUser.institutionId,
          department: newUser.department
        }
      },
      { 'Set-Cookie': cookieHeader }
    );
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return sendError(response, 400, 'Email and password are required.');
    }

    const foundUser = db.collection('users').findOne((u) => u.email === cleanEmail);
    if (!foundUser) {
      return sendError(response, 401, 'Invalid credentials. Please verify your email and password.');
    }

    if (foundUser.status === 'SUSPENDED') {
      return sendError(response, 403, 'Account has been suspended. Please contact flight-ops@vinastra.space.');
    }

    const isValid = verifyPassword(password, foundUser.passwordHash, foundUser.salt);
    if (!isValid) {
      await logAuditEvent({
        userId: foundUser.id,
        action: 'LOGIN_FAILED',
        resourceType: 'USER',
        resourceId: foundUser.id,
        details: 'Failed password attempt',
        request
      });
      return sendError(response, 401, 'Invalid credentials. Please verify your email and password.');
    }

    // Update last login
    await db.collection('users').updateById(foundUser.id, { lastLoginAt: new Date().toISOString() });

    const token = signToken({ uid: foundUser.id, role: foundUser.role });

    await logAuditEvent({
      userId: foundUser.id,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: foundUser.id,
      details: `User logged in from ${ip}`,
      request
    });

    const cookieHeader = `vinastra_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
    return sendJson(
      response,
      200,
      {
        token,
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          institutionId: foundUser.institutionId,
          department: foundUser.department
        }
      },
      { 'Set-Cookie': cookieHeader }
    );
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    if (user) {
      await logAuditEvent({
        userId: user.id,
        action: 'USER_LOGOUT',
        resourceType: 'USER',
        resourceId: user.id,
        details: 'Session terminated',
        request
      });
    }
    const cookieHeader = `vinastra_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
    return sendJson(response, 200, { loggedOut: true }, { 'Set-Cookie': cookieHeader });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');

    const unreadNotifications = db.collection('notifications').count((n) => n.userId === user.id && !n.read);
    const assignedTasks = db.collection('tasks').count((t) => t.assignedUserId === user.id && t.status !== 'DONE');

    return sendJson(response, 200, {
      user,
      telemetry: {
        unreadNotifications,
        assignedTasks,
        serverTime: new Date().toISOString()
      }
    });
  }

  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    const { email } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const existing = db.collection('users').findOne((u) => u.email === cleanEmail);

    if (existing) {
      const resetToken = generateRandomToken(32);
      await db.collection('passwordResets').insert({
        email: cleanEmail,
        token: resetToken,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        used: false
      });
      await logAuditEvent({
        userId: existing.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'USER',
        resourceId: existing.id,
        details: 'Password reset token generated',
        request
      });
    }

    // Always respond with success to avoid email enumeration
    return sendJson(response, 200, {
      message: 'If the provided email is registered, password recovery instructions have been dispatched.'
    });
  }

  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { token, newPassword } = body || {};
    if (!token || !newPassword || newPassword.length < 6) {
      return sendError(response, 400, 'Valid token and minimum 6 character password required');
    }

    const resetRecord = db.collection('passwordResets').findOne((r) => r.token === token && !r.used);
    if (!resetRecord || new Date() > new Date(resetRecord.expiresAt)) {
      return sendError(response, 400, 'Invalid or expired password reset token');
    }

    const targetUser = db.collection('users').findOne((u) => u.email === resetRecord.email);
    if (!targetUser) return sendError(response, 400, 'User not found');

    const { hash, salt } = hashPassword(newPassword);
    await db.collection('users').updateById(targetUser.id, { passwordHash: hash, salt });
    await db.collection('passwordResets').updateById(resetRecord.id, { used: true });

    await logAuditEvent({
      userId: targetUser.id,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'USER',
      resourceId: targetUser.id,
      details: 'Password successfully updated via reset token',
      request
    });

    return sendJson(response, 200, { message: 'Password has been reset successfully. You may now login.' });
  }

  // -------------------------------------------------------------
  // 3. DASHBOARD DATA AGGREGATOR
  // -------------------------------------------------------------

  if (pathname === '/api/dashboard/overview' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');

    // Filter projects based on user access
    const allProjects = db.collection('projects').find();
    const accessibleProjects = [];
    for (const proj of allProjects) {
      if (await canAccessProject(user, proj)) {
        accessibleProjects.push(proj);
      }
    }

    // Filter documents
    const allDocs = db.collection('documents').find();
    const accessibleDocs = [];
    for (const d of allDocs) {
      if (await canAccessDocument(user, d)) {
        accessibleDocs.push({
          id: d.id,
          title: d.title,
          fileName: d.fileName,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          fileCategory: d.fileCategory,
          accessLevel: d.accessLevel,
          version: d.version,
          createdAt: d.createdAt
        });
      }
    }

    // Role-specific data
    let roleSpecific = {};

    if (user.role === ROLES.STUDENT) {
      const myTasks = db.collection('tasks').find((t) => t.assignedUserId === user.id);
      const mySubmissions = db.collection('researchSubmissions').find((s) => s.authorUserId === user.id);
      roleSpecific = {
        roleTitle: 'Student & Academic Fellow',
        tasks: myTasks,
        submissions: mySubmissions,
        learningResources: [
          { title: 'ASCS Kinematics & 6-DoF Control Specification', category: 'Robotics' },
          { title: 'ROS2 Gazebo Orbital Simulation Guide', category: 'Simulation' },
          { title: 'Sub-Millimeter Metrology Calibration Procedures', category: 'Sensors' }
        ]
      };
    } else if (user.role === ROLES.RESEARCHER) {
      const mySubmissions = db.collection('researchSubmissions').find((s) => s.authorUserId === user.id || s.institutionId === user.institutionId);
      const assignedTasks = db.collection('tasks').find((t) => t.assignedUserId === user.id);
      roleSpecific = {
        roleTitle: 'Academic Researcher / Lab Director',
        submissions: mySubmissions,
        tasks: assignedTasks,
        institution: db.collection('institutions').findById(user.institutionId)
      };
    } else if (user.role === ROLES.ENGINEER) {
      const myReviews = db.collection('engineeringReviews').find();
      const myTasks = db.collection('tasks').find((t) => t.assignedUserId === user.id);
      roleSpecific = {
        roleTitle: 'Aerospace Systems Engineer',
        engineeringReviews: myReviews,
        tasks: myTasks,
        prototypeMilestones: [
          { name: 'Prototype-1 Rig Assembly', status: 'IN_PROGRESS', progress: 45 },
          { name: 'End-Effector Torque Test', status: 'APPROVED_FOR_TESTING', progress: 80 },
          { name: 'Metrology Vision Bench', status: 'IN_REVIEW', progress: 60 }
        ]
      };
    } else if (user.role === ROLES.INVESTOR) {
      // STRICT INVESTOR BOUNDARY: No internal CAD, no private university chats, no unpublished failures
      roleSpecific = {
        roleTitle: 'Institutional & Angel Partner',
        seedRaise: {
          target: '₹2.50 Cr',
          runway: '18 Months',
          instruments: 'iSAFE / Seed Equity',
          useOfFunds: [
            { category: 'Prototype Hardware & Sensors', percentage: 40 },
            { category: 'Core Engineering & Simulation Team', percentage: 35 },
            { category: 'Cleanroom Lab & Testing Facilities', percentage: 15 },
            { category: 'IP Protection & Regulatory Filings', percentage: 10 }
          ]
        },
        verifiedMilestones: [
          { milestone: 'ASCS Core Mathematical Modeling', status: 'VERIFIED_COMPLETE', date: 'Q2 2026' },
          { milestone: 'Prototype-1 Ground Demonstrator Design', status: 'IN_DEVELOPMENT', date: 'Target Q4 2026' },
          { milestone: 'University Space Robotics Joint Cell', status: 'FORMALIZED', date: 'Q3 2026' }
        ]
      };
    }

    const announcements = db.collection('announcements').find((a) => a.targetRole === 'ALL' || a.targetRole === user.role);
    const notifications = db.collection('notifications').find((n) => n.userId === user.id);

    return sendJson(response, 200, {
      profile: user,
      projects: accessibleProjects,
      documents: accessibleDocs,
      announcements,
      notifications,
      roleSpecific
    });
  }

  // -------------------------------------------------------------
  // 4. PROJECTS API
  // -------------------------------------------------------------

  if (pathname === '/api/projects' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');
    const all = db.collection('projects').find();
    const accessible = [];
    for (const p of all) {
      if (await canAccessProject(user, p)) accessible.push(p);
    }
    return sendJson(response, 200, accessible);
  }

  if (pathname.startsWith('/api/projects/') && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');
    const id = pathname.replace('/api/projects/', '');
    const project = db.collection('projects').findById(id);
    if (!project) return sendError(response, 404, 'Project not found');

    if (!(await canAccessProject(user, project))) {
      return sendError(response, 403, 'Unauthorized to view this project');
    }

    const members = db.collection('projectMembers').find((pm) => pm.projectId === project.id);
    const tasks = db.collection('tasks').find((t) => t.projectId === project.id);
    const docs = db.collection('documents').find((d) => d.projectId === project.id);

    return sendJson(response, 200, { project, members, tasks, documents: docs });
  }

  if (pathname === '/api/projects' && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (!hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER, ROLES.ENGINEER, ROLES.RESEARCHER])) {
      return sendError(response, 403, 'Only engineers, researchers, and admins can create projects');
    }

    const { code, title, description, category, confidentialityLevel, budget } = body || {};
    if (!code || !title || !category) {
      return sendError(response, 400, 'Code, title, and category are required');
    }

    const newProject = await db.collection('projects').insert({
      code: String(code).trim().toUpperCase(),
      title: String(title).trim(),
      description: String(description || '').trim(),
      category: String(category).trim().toUpperCase(),
      status: 'PLANNING',
      phase: 'Phase 1: Conceptual Architecture',
      leaderUserId: user.id,
      institutionId: user.institutionId || null,
      confidentialityLevel: confidentialityLevel || 'INTERNAL',
      budget: budget || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.collection('projectMembers').insert({
      projectId: newProject.id,
      userId: user.id,
      role: 'LEAD',
      joinedAt: new Date().toISOString()
    });

    await logAuditEvent({
      userId: user.id,
      action: 'PROJECT_CREATED',
      resourceType: 'PROJECT',
      resourceId: newProject.id,
      details: `Created project ${newProject.code}: ${newProject.title}`,
      request
    });

    return sendJson(response, 201, newProject);
  }

  // -------------------------------------------------------------
  // 5. TASKS API
  // -------------------------------------------------------------

  if (pathname === '/api/tasks' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');
    const myTasks = db.collection('tasks').find((t) => user.role === ROLES.ADMIN || t.assignedUserId === user.id || t.createdByUserId === user.id);
    return sendJson(response, 200, myTasks);
  }

  if (pathname === '/api/tasks' && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (!hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER, ROLES.ENGINEER, ROLES.RESEARCHER])) {
      return sendError(response, 403, 'Unauthorized to assign tasks');
    }

    const { projectId, title, description, assignedUserId, priority, deadline } = body || {};
    if (!title) return sendError(response, 400, 'Task title is required');

    const newTask = await db.collection('tasks').insert({
      projectId: projectId || null,
      title: String(title).trim(),
      description: String(description || '').trim(),
      assignedUserId: assignedUserId || user.id,
      createdByUserId: user.id,
      priority: priority || 'MEDIUM',
      status: 'TODO',
      deadline: deadline || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return sendJson(response, 201, newTask);
  }

  if (pathname.startsWith('/api/tasks/') && method === 'PUT') {
    if (!user) return sendError(response, 401, 'Authentication required');
    const id = pathname.replace('/api/tasks/', '');
    const task = db.collection('tasks').findById(id);
    if (!task) return sendError(response, 404, 'Task not found');

    const { status, title, description } = body || {};
    const updates = {};
    if (status) updates.status = status;
    if (title) updates.title = title;
    if (description) updates.description = description;

    const updated = await db.collection('tasks').updateById(id, updates);
    return sendJson(response, 200, updated);
  }

  // -------------------------------------------------------------
  // 6. RESEARCH WORKFLOWS
  // -------------------------------------------------------------

  if (pathname === '/api/research/submissions' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');
    const submissions = db.collection('researchSubmissions').find((s) => {
      if (user.role === ROLES.ADMIN || user.role === ROLES.FOUNDER) return true;
      if (s.authorUserId === user.id) return true;
      if (user.institutionId && s.institutionId === user.institutionId) return true;
      return false;
    });
    return sendJson(response, 200, submissions);
  }

  if (pathname === '/api/research/submissions' && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (!hasRole(user, [ROLES.STUDENT, ROLES.RESEARCHER, ROLES.ENGINEER, ROLES.ADMIN])) {
      return sendError(response, 403, 'Unauthorized to create research submissions');
    }

    const { title, abstract, methodology, findings, category, projectId } = body || {};
    if (!title || !abstract) return sendError(response, 400, 'Title and abstract are required');

    const newSub = await db.collection('researchSubmissions').insert({
      title: String(title).trim(),
      abstract: String(abstract).trim(),
      methodology: String(methodology || '').trim(),
      findings: String(findings || '').trim(),
      category: category || 'ROBOTICS_AND_CONTROL',
      authorUserId: user.id,
      institutionId: user.institutionId || null,
      projectId: projectId || null,
      status: 'SUBMITTED', // Initial workflow state
      reviewerNotes: null,
      decisionByUserId: null,
      decisionAt: null,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await logAuditEvent({
      userId: user.id,
      action: 'RESEARCH_SUBMITTED',
      resourceType: 'RESEARCH_SUBMISSION',
      resourceId: newSub.id,
      details: `Submission created: ${newSub.title}`,
      request
    });

    return sendJson(response, 201, newSub);
  }

  if (pathname.includes('/api/research/submissions/') && pathname.endsWith('/review') && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (!hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER, ROLES.RESEARCHER])) {
      return sendError(response, 403, 'Only authorized researchers and admins can review submissions');
    }

    const subId = pathname.replace('/api/research/submissions/', '').replace('/review', '');
    const submission = db.collection('researchSubmissions').findById(subId);
    if (!submission) return sendError(response, 404, 'Submission not found');

    const { status, reviewerNotes } = body || {};
    const validStatuses = ['UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED_FOR_NEXT_STAGE', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return sendError(response, 400, `Invalid review status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await db.collection('researchSubmissions').updateById(subId, {
      status,
      reviewerNotes: String(reviewerNotes || '').trim(),
      decisionByUserId: user.id,
      decisionAt: new Date().toISOString()
    });

    await logAuditEvent({
      userId: user.id,
      action: 'RESEARCH_REVIEW_DECIDED',
      resourceType: 'RESEARCH_SUBMISSION',
      resourceId: subId,
      details: `Decision ${status} recorded by ${user.name}`,
      request
    });

    return sendJson(response, 200, updated);
  }

  // -------------------------------------------------------------
  // 7. ENGINEERING REVIEWS
  // -------------------------------------------------------------

  if (pathname === '/api/engineering/reviews' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (user.role === ROLES.INVESTOR) {
      return sendError(response, 403, 'Confidential engineering reviews are restricted from investor accounts');
    }
    const reviews = db.collection('engineeringReviews').find();
    return sendJson(response, 200, reviews);
  }

  if (pathname === '/api/engineering/reviews' && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (!hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER, ROLES.ENGINEER])) {
      return sendError(response, 403, 'Only engineering personnel can register technical reviews');
    }

    const { projectId, componentName, subsystem, designRevision, failureModes, testingParameters } = body || {};
    if (!componentName || !subsystem) {
      return sendError(response, 400, 'Component name and subsystem are required');
    }

    const newReview = await db.collection('engineeringReviews').insert({
      projectId: projectId || null,
      componentName: String(componentName).trim(),
      subsystem: String(subsystem).trim(),
      designRevision: String(designRevision || 'Rev 1.0').trim(),
      failureModes: String(failureModes || '').trim(),
      reviewStage: 'TECHNICAL_REVIEW',
      reviewerUserId: null,
      verdict: 'PENDING',
      verdictNotes: null,
      testingParameters: String(testingParameters || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return sendJson(response, 201, newReview);
  }

  if (pathname.includes('/api/engineering/reviews/') && pathname.endsWith('/decision') && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (!hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER, ROLES.ENGINEER])) {
      return sendError(response, 403, 'Unauthorized to approve engineering reviews');
    }

    const revId = pathname.replace('/api/engineering/reviews/', '').replace('/decision', '');
    const review = db.collection('engineeringReviews').findById(revId);
    if (!review) return sendError(response, 404, 'Engineering review not found');

    const { reviewStage, verdict, verdictNotes } = body || {};
    const validStages = ['TECHNICAL_REVIEW', 'APPROVED_FOR_TESTING', 'TESTED', 'REVISED', 'CLOSED'];
    if (!validStages.includes(reviewStage)) {
      return sendError(response, 400, `Invalid review stage. Must be: ${validStages.join(', ')}`);
    }

    // Enforce aerospace disclaimer requirement
    let sanitizedNotes = String(verdictNotes || '').trim();
    if (reviewStage === 'APPROVED_FOR_TESTING') {
      sanitizedNotes += ' [DISCLAIMER: Approval for testing represents validation for controlled ground test cell only and does not constitute flight qualification.]';
    }

    const updated = await db.collection('engineeringReviews').updateById(revId, {
      reviewStage,
      verdict: verdict || reviewStage,
      verdictNotes: sanitizedNotes,
      reviewerUserId: user.id
    });

    await logAuditEvent({
      userId: user.id,
      action: 'ENGINEERING_REVIEW_DECIDED',
      resourceType: 'ENGINEERING_REVIEW',
      resourceId: revId,
      details: `Stage updated to ${reviewStage} by ${user.name}`,
      request
    });

    return sendJson(response, 200, updated);
  }

  // -------------------------------------------------------------
  // 8. INSTITUTIONS & COLLABORATION
  // -------------------------------------------------------------

  if (pathname === '/api/institutions' && method === 'GET') {
    const insts = db.collection('institutions').find((i) => i.status === 'ACTIVE');
    return sendJson(response, 200, insts);
  }

  if (pathname === '/api/institutions' && method === 'POST') {
    if (!user || !hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER])) {
      return sendError(response, 403, 'Administrative access required to register institutions');
    }

    const { code, name, domain, type } = body || {};
    if (!code || !name) return sendError(response, 400, 'Code and name required');

    const newInst = await db.collection('institutions').insert({
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      domain: String(domain || '').trim().toLowerCase(),
      type: type || 'UNIVERSITY',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });

    return sendJson(response, 201, newInst);
  }

  // -------------------------------------------------------------
  // 9. DOCUMENTS & TECHNICAL VAULT
  // -------------------------------------------------------------

  if (pathname === '/api/documents' && method === 'GET') {
    if (!user) return sendError(response, 401, 'Authentication required');
    const all = db.collection('documents').find();
    const accessible = [];
    for (const d of all) {
      if (await canAccessDocument(user, d)) {
        accessible.push(d);
      }
    }
    return sendJson(response, 200, accessible);
  }

  if (pathname === '/api/documents' && method === 'POST') {
    if (!user) return sendError(response, 401, 'Authentication required');
    if (user.role === ROLES.INVESTOR) {
      return sendError(response, 403, 'Investor accounts cannot upload technical documents');
    }

    const { title, fileName, fileSize, mimeType, fileCategory, projectId, accessLevel } = body || {};
    if (!title || !fileName) return sendError(response, 400, 'Title and fileName are required');

    const newDoc = await db.collection('documents').insert({
      title: String(title).trim(),
      fileName: String(fileName).trim(),
      filePath: `data/secure_vault/documents/${String(fileName).trim()}`,
      fileSize: Number(fileSize) || 1024,
      mimeType: mimeType || 'application/pdf',
      fileCategory: fileCategory || 'ENGINEERING_REPORT',
      uploadedByUserId: user.id,
      projectId: projectId || null,
      institutionId: user.institutionId || null,
      accessLevel: accessLevel || 'INTERNAL_CONFIDENTIAL',
      version: 1,
      downloadCount: 0,
      createdAt: new Date().toISOString()
    });

    await logAuditEvent({
      userId: user.id,
      action: 'DOCUMENT_METADATA_REGISTERED',
      resourceType: 'DOCUMENT',
      resourceId: newDoc.id,
      details: `Document registered: ${newDoc.title} (${newDoc.accessLevel})`,
      request
    });

    return sendJson(response, 201, newDoc);
  }

  // -------------------------------------------------------------
  // 10. ADMINISTRATION PORTAL API
  // -------------------------------------------------------------

  if (pathname.startsWith('/api/admin/')) {
    if (!user || !hasRole(user, [ROLES.ADMIN, ROLES.FOUNDER])) {
      return sendError(response, 403, 'Administrative access required for this resource');
    }

    if (pathname === '/api/admin/metrics' && method === 'GET') {
      const usersCount = db.collection('users').count();
      const activeProjects = db.collection('projects').count((p) => p.status === 'ACTIVE');
      const pendingReviews =
        db.collection('researchSubmissions').count((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW') +
        db.collection('engineeringReviews').count((r) => r.reviewStage === 'TECHNICAL_REVIEW');
      const totalDocs = db.collection('documents').count();
      const auditCount = db.collection('auditLogs').count();

      return sendJson(response, 200, {
        metrics: {
          usersCount,
          activeProjects,
          pendingReviews,
          totalDocs,
          auditCount,
          systemStatus: 'NOMINAL · ALL SYSTEMS GO'
        }
      });
    }

    if (pathname === '/api/admin/users' && method === 'GET') {
      const users = db.collection('users').find().map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        institutionId: u.institutionId,
        department: u.department,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt
      }));
      return sendJson(response, 200, users);
    }

    if (pathname.includes('/api/admin/users/') && pathname.endsWith('/role') && method === 'POST') {
      const targetUid = pathname.replace('/api/admin/users/', '').replace('/role', '');
      const { role } = body || {};
      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(role)) {
        return sendError(response, 400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      const updated = await db.collection('users').updateById(targetUid, { role });
      if (!updated) return sendError(response, 404, 'User not found');

      await logAuditEvent({
        userId: user.id,
        action: 'USER_ROLE_ELEVATED',
        resourceType: 'USER',
        resourceId: targetUid,
        details: `Role updated to ${role} by Admin ${user.name}`,
        request
      });

      return sendJson(response, 200, { success: true, user: updated });
    }

    if (pathname.includes('/api/admin/users/') && pathname.endsWith('/status') && method === 'POST') {
      const targetUid = pathname.replace('/api/admin/users/', '').replace('/status', '');
      const { status } = body || {};
      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return sendError(response, 400, 'Status must be ACTIVE or SUSPENDED');
      }

      const updated = await db.collection('users').updateById(targetUid, { status });
      if (!updated) return sendError(response, 404, 'User not found');

      await logAuditEvent({
        userId: user.id,
        action: 'USER_STATUS_UPDATED',
        resourceType: 'USER',
        resourceId: targetUid,
        details: `User status changed to ${status} by Admin ${user.name}`,
        request
      });

      return sendJson(response, 200, { success: true, user: updated });
    }

    if (pathname === '/api/admin/audit-logs' && method === 'GET') {
      const logs = db.collection('auditLogs').find();
      // Reverse chronological order
      return sendJson(response, 200, [...logs].reverse().slice(0, 50));
    }
  }

  // If no API matched
  return sendError(response, 404, 'API endpoint not found');
}
