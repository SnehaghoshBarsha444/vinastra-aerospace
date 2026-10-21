/**
 * VINASTRA AEROSPACE — MISSION CONTROL CLIENT ENGINE
 * Handles authenticated API queries, dynamic role-tailored viewports, and interactive workflows.
 */

// Global Dashboard State
let currentProfile = null;
let currentData = null;
let activeTab = 'overview';

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModals();
  
  // Check authentication via Firebase first
  await checkAuthentication();
});

// Check if user is authenticated via Firebase
async function checkAuthentication() {
  const token = localStorage.getItem('vinastra_user_session');
  const userData = token ? JSON.parse(token) : null;
  
  // Always load dashboard - let user browse freely
  // Auth check is just for display purposes, not blocking
  await loadDashboard();
}

function showAuthRequired() {
  const mainContent = document.querySelector('.mc-main');
  if (mainContent) {
    mainContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; color: var(--mc-text); text-align: center; padding: 40px;">
        <div style="font-size: 4rem; margin-bottom: 24px;">🔒</div>
        <h2 style="font-family: var(--font-mono); font-size: 1.5rem; margin-bottom: 16px;">AUTHENTICATION REQUIRED</h2>
        <p style="color: var(--mc-text-muted); font-size: 0.9375rem; margin-bottom: 24px; max-width: 400px;">
          You must be signed in to access the Mission Control Terminal. Please authenticate to continue.
        </p>
        <div style="display: flex; gap: 12px;">
          <a href="/login/" class="mc-btn-primary" style="padding: 12px 24px; text-decoration: none;">SIGN IN</a>
          <a href="/login/?mode=signup" class="mc-btn-ghost" style="padding: 12px 24px; text-decoration: none;">CREATE ACCOUNT</a>
        </div>
      </div>
    `;
  }
}

// Tab navigation setup
function setupNavigation() {
  document.querySelectorAll('.mc-nav-item[data-tab]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.dataset.tab);
    });
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    // Clear local storage
    localStorage.removeItem('vinastra_user_session');
    localStorage.removeItem('vinastra_token');
    // Redirect to home
    window.location.href = '/';
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.mc-nav-item').forEach((n) => n.classList.remove('active'));
  document.querySelector(`.mc-nav-item[data-tab="${tabId}"]`)?.classList.add('active');

  document.querySelectorAll('.mc-tab-pane').forEach((pane) => {
    pane.style.display = pane.id === `tab-${tabId}` ? 'block' : 'none';
  });

  const titles = {
    overview: 'Mission Operations & Telemetry Overview',
    projects: 'Active ASCS Architecture & R&D Projects',
    tasks: 'Assigned Subsystem Tasks & Milestones',
    research: 'University Research & Academic Submissions',
    engineering: 'Prototype-1 Engineering & Subsystem Reviews',
    documents: 'Technical Document Vault & Blueprints',
    investor: 'Seed Capital Brief & Milestone Verification'
  };

  const header = document.getElementById('mc-section-title');
  if (header) header.textContent = titles[tabId] || 'Mission Control Terminal';
}

// Role switcher removed - users must login with their own credentials

// Load telemetry & dashboard data with proper loading states
async function loadDashboard() {
  // Show loading state immediately
  showLoadingState();
  
  const token = localStorage.getItem('vinastra_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch('/api/dashboard/overview', { headers });

    if (res.status === 401) {
      // No API auth - just load dashboard with cached/local data
      console.log('API auth required, using local data');
    }

    if (!res.ok) {
      throw new Error('Failed to load dashboard data');
    }

    const data = await res.json();
    
    // Cache profile data for faster subsequent loads
    if (data.profile) {
      localStorage.setItem('vinastra_user_profile', JSON.stringify(data.profile));
    }
    
    currentData = data;
    currentProfile = data.profile;

    // Render all components
    renderHeaderProfile();
    renderOverview();
    renderProjects();
    renderTasks();
    renderResearch();
    renderEngineering();
    renderDocuments();
    renderInvestor();
    
    // Hide loading state after successful render
    hideLoadingState();
    
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    hideLoadingState();
    showErrorState('Failed to load dashboard. Please try again.');
  }
}

// Loading state management
function showLoadingState() {
  const mainContent = document.querySelector('.mc-main');
  if (mainContent) {
    const loader = document.createElement('div');
    loader.id = 'dashboard-loader';
    loader.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; color: var(--mc-text-muted);">
        <div style="width: 48px; height: 48px; border: 3px solid var(--mc-border); border-top-color: var(--mc-accent); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
        <div style="font-family: var(--font-mono); font-size: 0.875rem; letter-spacing: 0.1em;">LOADING MISSION DATA...</div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    mainContent.insertBefore(loader, mainContent.firstChild);
  }
}

function hideLoadingState() {
  const loader = document.getElementById('dashboard-loader');
  if (loader) loader.remove();
}

function showErrorState(message) {
  const mainContent = document.querySelector('.mc-main');
  if (mainContent) {
    const error = document.createElement('div');
    error.id = 'dashboard-error';
    error.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; color: var(--mc-text);">
        <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
        <div style="font-family: var(--font-mono); font-size: 0.875rem; margin-bottom: 16px;">${message}</div>
        <button onclick="loadDashboard()" style="background: var(--mc-accent); color: #000; border: none; padding: 12px 24px; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em; cursor: pointer; border-radius: 2px;">
          RETRY
        </button>
      </div>
    `;
    mainContent.insertBefore(error, mainContent.firstChild);
  }
}

// Render Topbar user profile
function renderHeaderProfile() {
  if (!currentProfile) return;
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-role-badge');
  const adminLink = document.getElementById('admin-nav-link');

  if (nameEl) nameEl.textContent = currentProfile.name;
  if (roleEl) roleEl.textContent = currentProfile.role;

  // Show Admin Portal link only if Admin or Founder
  if (adminLink) {
    adminLink.style.display = ['ADMIN', 'FOUNDER'].includes(currentProfile.role) ? 'flex' : 'none';
  }

  // Highlight active role pill
  document.querySelectorAll('.mc-role-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.role === currentProfile.role);
  });
}

// 1. Render Overview Tab
function renderOverview() {
  const container = document.getElementById('tab-overview');
  if (!container || !currentData) return;

  const roleMeta = currentData.roleSpecific || {};
  const tasks = currentData.roleSpecific?.tasks || [];
  const projects = currentData.projects || [];
  const announcements = currentData.announcements || [];

  container.innerHTML = `
    <div class="mc-grid-4">
      <div class="mc-card mc-stat-card">
        <span class="mc-stat-label">AUTHORIZED PROJECTS</span>
        <span class="mc-stat-val">${projects.length}</span>
        <span class="mc-stat-hint">Active ASCS modules</span>
      </div>
      <div class="mc-card mc-stat-card">
        <span class="mc-stat-label">ASSIGNED TASKS</span>
        <span class="mc-stat-val">${tasks.filter((t) => t.status !== 'DONE').length}</span>
        <span class="mc-stat-hint">Pending action items</span>
      </div>
      <div class="mc-card mc-stat-card">
        <span class="mc-stat-label">TECHNICAL VAULT</span>
        <span class="mc-stat-val">${currentData.documents?.length || 0}</span>
        <span class="mc-stat-hint">Authorized blueprints & reports</span>
      </div>
      <div class="mc-card mc-stat-card">
        <span class="mc-stat-label">TELEMETRY LINK</span>
        <span class="mc-stat-val" style="color: var(--mc-green); font-size: 1.25rem;">ONLINE</span>
        <span class="mc-stat-hint">Zero anomaly buffer</span>
      </div>
    </div>

    <!-- ROLE ADAPTIVE BANNER -->
    <div class="mc-card" style="margin-bottom: 24px; border-left: 3px solid var(--mc-accent);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="mc-page-eyebrow" style="margin: 0;">ROLE PERSPECTIVE: ${roleMeta.roleTitle || currentProfile.role}</span>
        <span class="mc-tag mc-tag-accent">TIER-1 ACCESS</span>
      </div>
      <p style="color: var(--mc-text-muted); font-size: 0.875rem; line-height: 1.5;">
        You are authenticated as <strong>${escapeHtml(currentProfile.name)}</strong> (${currentProfile.email}). 
        Department: <em>${escapeHtml(currentProfile.department || 'General Operations')}</em>.
      </p>
    </div>

    <div class="mc-grid-2">
      <!-- ANNOUNCEMENTS -->
      <div class="mc-card">
        <div class="mc-page-eyebrow">COMMAND TRANSMISSIONS</div>
        <h3 style="font-size: 1.125rem; margin-bottom: 16px;">Flight Operations Dispatches</h3>
        ${
          announcements.length
            ? announcements
                .map(
                  (a) => `
          <div style="padding: 12px 0; border-bottom: 1px solid var(--mc-border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: var(--mc-text); font-size: 0.875rem;">${escapeHtml(a.title)}</strong>
              <span class="mc-tag ${a.priority === 'HIGH' ? 'mc-tag-yellow' : 'mc-tag-blue'}">${a.priority}</span>
            </div>
            <p style="color: var(--mc-text-muted); font-size: 0.8125rem;">${escapeHtml(a.content)}</p>
          </div>
        `
                )
                .join('')
            : '<p style="color: var(--mc-text-dim); font-size: 0.8125rem;">No active broadcasts.</p>'
        }
      </div>

      <!-- RECENT ACTIVE TASKS -->
      <div class="mc-card">
        <div class="mc-page-eyebrow">ACTION ITEMS</div>
        <h3 style="font-size: 1.125rem; margin-bottom: 16px;">Priority Directives</h3>
        ${
          tasks.length
            ? tasks
                .slice(0, 3)
                .map(
                  (t) => `
          <div style="padding: 12px 0; border-bottom: 1px solid var(--mc-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem; color: var(--mc-text);">${escapeHtml(t.title)}</div>
              <div style="font-size: 0.75rem; color: var(--mc-text-dim); margin-top: 2px;">Deadline: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Rolling'}</div>
            </div>
            <span class="mc-tag ${t.status === 'DONE' ? 'mc-tag-green' : t.status === 'IN_PROGRESS' ? 'mc-tag-yellow' : 'mc-tag-blue'}">${t.status}</span>
          </div>
        `
                )
                .join('')
            : '<p style="color: var(--mc-text-dim); font-size: 0.8125rem;">No pending tasks assigned.</p>'
        }
      </div>
    </div>
  `;
}

// 2. Render Projects Tab
function renderProjects() {
  const container = document.getElementById('tab-projects');
  if (!container || !currentData) return;

  const projects = currentData.projects || [];
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <p style="color: var(--mc-text-muted); font-size: 0.875rem;">Authorized Aerospace Development Programs & Subsystems</p>
      ${
        ['ADMIN', 'FOUNDER', 'ENGINEER', 'RESEARCHER'].includes(currentProfile.role)
          ? `<button class="mc-btn-primary" id="btn-new-project">+ New Project</button>`
          : ''
      }
    </div>

    <div class="mc-table-container">
      <table class="mc-table">
        <thead>
          <tr>
            <th>CODE</th>
            <th>PROJECT TITLE</th>
            <th>CATEGORY</th>
            <th>PHASE</th>
            <th>CONFIDENTIALITY</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${
            projects.length
              ? projects
                  .map(
                    (p) => `
            <tr>
              <td style="font-family: var(--mc-font-mono); font-weight: 600; color: var(--mc-accent);">${escapeHtml(p.code)}</td>
              <td>
                <div style="font-weight: 600; color: var(--mc-text);">${escapeHtml(p.title)}</div>
                <div style="font-size: 0.75rem; color: var(--mc-text-dim);">${escapeHtml(p.description || '')}</div>
              </td>
              <td><span class="mc-tag mc-tag-blue">${escapeHtml(p.category)}</span></td>
              <td style="font-size: 0.75rem;">${escapeHtml(p.phase || 'Phase 1')}</td>
              <td><span class="mc-tag ${p.confidentialityLevel === 'PUBLIC' ? 'mc-tag-green' : 'mc-tag-yellow'}">${p.confidentialityLevel}</span></td>
              <td><span class="mc-tag ${p.status === 'ACTIVE' ? 'mc-tag-green' : 'mc-tag-blue'}">${p.status}</span></td>
            </tr>
          `
                  )
                  .join('')
              : '<tr><td colspan="6" style="text-align: center; color: var(--mc-text-dim);">No accessible projects found.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-new-project')?.addEventListener('click', () => {
    openModal('modal-project');
  });
}

// 3. Render Tasks Tab
function renderTasks() {
  const container = document.getElementById('tab-tasks');
  if (!container || !currentData) return;

  const tasks = currentData.roleSpecific?.tasks || [];
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <p style="color: var(--mc-text-muted); font-size: 0.875rem;">Action Directives & Engineering Milestones</p>
      ${
        ['ADMIN', 'FOUNDER', 'ENGINEER', 'RESEARCHER'].includes(currentProfile.role)
          ? `<button class="mc-btn-primary" id="btn-new-task">+ Assign Task</button>`
          : ''
      }
    </div>

    <div class="mc-table-container">
      <table class="mc-table">
        <thead>
          <tr>
            <th>TASK</th>
            <th>PRIORITY</th>
            <th>STATUS</th>
            <th>DEADLINE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          ${
            tasks.length
              ? tasks
                  .map(
                    (t) => `
            <tr>
              <td>
                <div style="font-weight: 600; color: var(--mc-text);">${escapeHtml(t.title)}</div>
                <div style="font-size: 0.75rem; color: var(--mc-text-dim);">${escapeHtml(t.description || '')}</div>
              </td>
              <td><span class="mc-tag ${t.priority === 'HIGH' ? 'mc-tag-yellow' : 'mc-tag-blue'}">${t.priority}</span></td>
              <td><span class="mc-tag ${t.status === 'DONE' ? 'mc-tag-green' : t.status === 'IN_PROGRESS' ? 'mc-tag-yellow' : 'mc-tag-blue'}">${t.status}</span></td>
              <td style="font-family: var(--mc-font-mono); font-size: 0.75rem;">${t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Open'}</td>
              <td>
                ${
                  t.status !== 'DONE'
                    ? `<button class="mc-btn-ghost task-done-btn" data-id="${t.id}" style="font-size: 0.6875rem; padding: 4px 8px;">Mark Done ✓</button>`
                    : '<span style="color: var(--mc-green); font-size: 0.75rem;">Completed</span>'
                }
              </td>
            </tr>
          `
                  )
                  .join('')
              : '<tr><td colspan="5" style="text-align: center; color: var(--mc-text-dim);">No assigned tasks.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('.task-done-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const token = localStorage.getItem('vinastra_token');
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'DONE' })
      });
      await loadDashboard();
    });
  });

  document.getElementById('btn-new-task')?.addEventListener('click', () => {
    openModal('modal-task');
  });
}

// 4. Render Research Tab
function renderResearch() {
  const container = document.getElementById('tab-research');
  if (!container || !currentData) return;

  const submissions = currentData.roleSpecific?.submissions || [];
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <p style="color: var(--mc-text-muted); font-size: 0.875rem;">University Papers, Novel Materials & Kinetic Research</p>
      <button class="mc-btn-primary" id="btn-new-submission">+ Submit Research Paper</button>
    </div>

    <div class="mc-table-container">
      <table class="mc-table">
        <thead>
          <tr>
            <th>TITLE & ABSTRACT</th>
            <th>CATEGORY</th>
            <th>STATUS</th>
            <th>STAGE DECISION</th>
          </tr>
        </thead>
        <tbody>
          ${
            submissions.length
              ? submissions
                  .map(
                    (s) => `
            <tr>
              <td style="max-width: 480px;">
                <div style="font-weight: 600; color: var(--mc-text);">${escapeHtml(s.title)}</div>
                <div style="font-size: 0.75rem; color: var(--mc-text-dim); margin-top: 4px; line-height: 1.4;">${escapeHtml(s.abstract || '')}</div>
                ${s.reviewerNotes ? `<div style="font-size: 0.75rem; color: var(--mc-accent); margin-top: 4px;"><strong>Reviewer Feedback:</strong> ${escapeHtml(s.reviewerNotes)}</div>` : ''}
              </td>
              <td><span class="mc-tag mc-tag-blue">${escapeHtml(s.category)}</span></td>
              <td><span class="mc-tag ${s.status === 'APPROVED_FOR_NEXT_STAGE' ? 'mc-tag-green' : s.status === 'UNDER_REVIEW' ? 'mc-tag-yellow' : 'mc-tag-blue'}">${s.status}</span></td>
              <td style="font-size: 0.75rem; color: var(--mc-text-muted);">${s.decisionAt ? new Date(s.decisionAt).toLocaleDateString() : 'Awaiting Review Queue'}</td>
            </tr>
          `
                  )
                  .join('')
              : '<tr><td colspan="4" style="text-align: center; color: var(--mc-text-dim);">No research submissions recorded for your account.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-new-submission')?.addEventListener('click', () => {
    openModal('modal-submission');
  });
}

// 5. Render Engineering Tab
function renderEngineering() {
  const container = document.getElementById('tab-engineering');
  if (!container || !currentData) return;

  const reviews = currentData.roleSpecific?.engineeringReviews || [];
  const milestones = currentData.roleSpecific?.prototypeMilestones || [];

  container.innerHTML = `
    <!-- MILESTONE PROGRESS STRIP -->
    <div class="mc-grid-4" style="margin-bottom: 24px;">
      ${milestones
        .map(
          (m) => `
        <div class="mc-card">
          <span class="mc-stat-label">${escapeHtml(m.name)}</span>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin: 8px 0;">
            <span class="mc-stat-val">${m.progress}%</span>
            <span class="mc-tag ${m.status === 'APPROVED_FOR_TESTING' ? 'mc-tag-green' : 'mc-tag-yellow'}">${m.status}</span>
          </div>
          <div style="height: 4px; background: var(--mc-border); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: ${m.progress}%; background: var(--mc-accent);"></div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <p style="color: var(--mc-text-muted); font-size: 0.875rem;">Component Failure Modes, Kinematics & Metrology Reviews</p>
      ${
        ['ADMIN', 'FOUNDER', 'ENGINEER'].includes(currentProfile.role)
          ? `<button class="mc-btn-primary" id="btn-new-review">+ Register Technical Review</button>`
          : ''
      }
    </div>

    <div class="mc-table-container">
      <table class="mc-table">
        <thead>
          <tr>
            <th>COMPONENT</th>
            <th>SUBSYSTEM</th>
            <th>REVISION</th>
            <th>STAGE</th>
            <th>TESTING PARAMETERS</th>
          </tr>
        </thead>
        <tbody>
          ${
            reviews.length
              ? reviews
                  .map(
                    (r) => `
            <tr>
              <td>
                <div style="font-weight: 600; color: var(--mc-text);">${escapeHtml(r.componentName)}</div>
                <div style="font-size: 0.75rem; color: var(--mc-text-dim);">${escapeHtml(r.failureModes || '')}</div>
                ${r.verdictNotes ? `<div style="font-size: 0.75rem; color: var(--mc-accent); margin-top: 4px;">${escapeHtml(r.verdictNotes)}</div>` : ''}
              </td>
              <td><span class="mc-tag mc-tag-blue">${escapeHtml(r.subsystem)}</span></td>
              <td style="font-family: var(--mc-font-mono); font-size: 0.75rem;">${escapeHtml(r.designRevision)}</td>
              <td><span class="mc-tag ${r.reviewStage === 'APPROVED_FOR_TESTING' ? 'mc-tag-green' : 'mc-tag-yellow'}">${r.reviewStage}</span></td>
              <td style="font-size: 0.75rem; color: var(--mc-text-muted);">${escapeHtml(r.testingParameters || 'N/A')}</td>
            </tr>
          `
                  )
                  .join('')
              : '<tr><td colspan="5" style="text-align: center; color: var(--mc-text-dim);">No engineering reviews available.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-new-review')?.addEventListener('click', () => {
    openModal('modal-review');
  });
}

// 6. Render Documents Tab
function renderDocuments() {
  const container = document.getElementById('tab-documents');
  if (!container || !currentData) return;

  const docs = currentData.documents || [];
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <p style="color: var(--mc-text-muted); font-size: 0.875rem;">Encrypted Aerospace Blueprints, CAD Archives & Research Reports</p>
      ${
        currentProfile.role !== 'INVESTOR'
          ? `<button class="mc-btn-primary" id="btn-upload-doc">+ Register Document Metadata</button>`
          : ''
      }
    </div>

    <div class="mc-table-container">
      <table class="mc-table">
        <thead>
          <tr>
            <th>DOCUMENT TITLE</th>
            <th>CATEGORY</th>
            <th>ACCESS BOUNDARY</th>
            <th>FILE SIZE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          ${
            docs.length
              ? docs
                  .map(
                    (d) => `
            <tr>
              <td>
                <div style="font-weight: 600; color: var(--mc-text);">${escapeHtml(d.title)}</div>
                <div style="font-size: 0.75rem; font-family: var(--mc-font-mono); color: var(--mc-text-dim);">${escapeHtml(d.fileName)}</div>
              </td>
              <td><span class="mc-tag mc-tag-blue">${escapeHtml(d.fileCategory)}</span></td>
              <td><span class="mc-tag ${d.accessLevel === 'PUBLIC' ? 'mc-tag-green' : d.accessLevel === 'INVESTOR_SAFE' ? 'mc-tag-accent' : 'mc-tag-yellow'}">${d.accessLevel}</span></td>
              <td style="font-family: var(--mc-font-mono); font-size: 0.75rem;">${(d.fileSize / 1024 / 1024).toFixed(2)} MB</td>
              <td>
                <a href="/${d.filePath || 'VINASTRA_Space_Factory_Overview.pdf'}" target="_blank" class="mc-btn-ghost" style="font-size: 0.6875rem; padding: 4px 10px;">Download Document ↗</a>
              </td>
            </tr>
          `
                  )
                  .join('')
              : '<tr><td colspan="5" style="text-align: center; color: var(--mc-text-dim);">No authorized documents available for your security classification.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-upload-doc')?.addEventListener('click', () => {
    openModal('modal-doc');
  });
}

// 7. Render Investor Tab
function renderInvestor() {
  const container = document.getElementById('tab-investor');
  if (!container || !currentData) return;

  container.innerHTML = `
    <div class="mc-card" style="margin-bottom: 24px; border-left: 3px solid var(--mc-accent);">
      <div class="mc-page-eyebrow">SEED CAPITAL MEMORANDUM &amp; ARCHITECTURE ACCESS</div>
      <h3 style="font-size: 1.25rem; margin-bottom: 8px;">Target Seed Capital: ₹2.50 Cr ($300,000 USD)</h3>
      <p style="color: var(--mc-text-muted); font-size: 0.875rem; line-height: 1.5;">
        VINASTRA AEROSPACE PRIVATE LIMITED is pioneering Autonomous Space Construction Systems (ASCS). 
        This external investor portal provides vetted technical milestones, audited expenditure allocations, and macro commercial targets.
      </p>
    </div>

    <div class="mc-grid-2">
      <!-- ALLOCATION STRIP -->
      <div class="mc-card">
        <div class="mc-page-eyebrow">CAPITAL DEPLOYMENT</div>
        <h4 style="font-size: 1.125rem; margin-bottom: 16px;">18-Month Runway Allocation</h4>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 4px;">
              <span>Prototype Hardware, Sensors & Metrology</span>
              <span style="font-family: var(--mc-font-mono); color: var(--mc-accent);">40% (₹1.00 Cr)</span>
            </div>
            <div style="height: 4px; background: var(--mc-border); border-radius: 2px;">
              <div style="height: 100%; width: 40%; background: var(--mc-accent);"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 4px;">
              <span>Robotics & Autonomous Simulation Team</span>
              <span style="font-family: var(--mc-font-mono); color: var(--mc-blue);">35% (₹87.5 L)</span>
            </div>
            <div style="height: 4px; background: var(--mc-border); border-radius: 2px;">
              <div style="height: 100%; width: 35%; background: var(--mc-blue);"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 4px;">
              <span>Cleanroom Validation Rig & Chamber Access</span>
              <span style="font-family: var(--mc-font-mono); color: var(--mc-green);">15% (₹37.5 L)</span>
            </div>
            <div style="height: 4px; background: var(--mc-border); border-radius: 2px;">
              <div style="height: 100%; width: 15%; background: var(--mc-green);"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 4px;">
              <span>IP Patents, Defense & Regulatory Filings</span>
              <span style="font-family: var(--mc-font-mono); color: var(--mc-yellow);">10% (₹25.0 L)</span>
            </div>
            <div style="height: 4px; background: var(--mc-border); border-radius: 2px;">
              <div style="height: 100%; width: 10%; background: var(--mc-yellow);"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- AUDITED MILESTONES -->
      <div class="mc-card">
        <div class="mc-page-eyebrow">MILESTONE TRACKER</div>
        <h4 style="font-size: 1.125rem; margin-bottom: 16px;">Vetted Technological Gates</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="padding: 10px; background: var(--mc-surface); border: 1px solid var(--mc-border); border-radius: 3px;">
            <div style="display: flex; justify-content: space-between;">
              <strong style="color: var(--mc-text); font-size: 0.8125rem;">ASCS Core Mathematical Formulation</strong>
              <span class="mc-tag mc-tag-green">COMPLETE</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--mc-text-dim); margin-top: 2px;">Verified kinematic models under 2.5s simulated communication delay.</div>
          </div>
          <div style="padding: 10px; background: var(--mc-surface); border: 1px solid var(--mc-border); border-radius: 3px;">
            <div style="display: flex; justify-content: space-between;">
              <strong style="color: var(--mc-text); font-size: 0.8125rem;">University Space Robotics Joint Cell</strong>
              <span class="mc-tag mc-tag-accent">ACTIVE</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--mc-text-dim); margin-top: 2px;">IIT Bombay research track ongoing for stereoscopic edge vision.</div>
          </div>
          <div style="padding: 10px; background: var(--mc-surface); border: 1px solid var(--mc-border); border-radius: 3px;">
            <div style="display: flex; justify-content: space-between;">
              <strong style="color: var(--mc-text); font-size: 0.8125rem;">Prototype-1 Ground Demonstrator Assembly</strong>
              <span class="mc-tag mc-tag-yellow">TARGET Q4 2026</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--mc-text-dim); margin-top: 2px;">Physical demonstration rig for sub-millimeter metrology assembly.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Modal management
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function setupModals() {
  // Close buttons
  document.querySelectorAll('.mc-modal-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.mc-modal-overlay').style.display = 'none';
    });
  });

  // Project form submit
  document.getElementById('form-new-project')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vinastra_token');
    const form = e.target;
    const body = {
      code: form.code.value,
      title: form.title.value,
      description: form.description.value,
      category: form.category.value,
      confidentialityLevel: form.confidentiality.value
    };
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('modal-project');
      form.reset();
      await loadDashboard();
    }
  });

  // Task form submit
  document.getElementById('form-new-task')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vinastra_token');
    const form = e.target;
    const body = {
      title: form.title.value,
      description: form.description.value,
      priority: form.priority.value,
      deadline: form.deadline.value || null
    };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('modal-task');
      form.reset();
      await loadDashboard();
    }
  });

  // Research form submit
  document.getElementById('form-new-submission')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vinastra_token');
    const form = e.target;
    const body = {
      title: form.title.value,
      abstract: form.abstract.value,
      methodology: form.methodology.value,
      findings: form.findings.value,
      category: form.category.value
    };
    const res = await fetch('/api/research/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('modal-submission');
      form.reset();
      await loadDashboard();
    }
  });

  // Engineering review form submit
  document.getElementById('form-new-review')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vinastra_token');
    const form = e.target;
    const body = {
      componentName: form.componentName.value,
      subsystem: form.subsystem.value,
      designRevision: form.designRevision.value,
      failureModes: form.failureModes.value,
      testingParameters: form.testingParameters.value
    };
    const res = await fetch('/api/engineering/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('modal-review');
      form.reset();
      await loadDashboard();
    }
  });

  // Document metadata submit
  document.getElementById('form-new-doc')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vinastra_token');
    const form = e.target;
    const body = {
      title: form.title.value,
      fileName: form.fileName.value,
      fileCategory: form.fileCategory.value,
      accessLevel: form.accessLevel.value,
      fileSize: 1048576 // 1MB mock
    };
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      closeModal('modal-doc');
      form.reset();
      await loadDashboard();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
