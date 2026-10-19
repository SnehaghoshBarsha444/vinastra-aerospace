# VINASTRA AEROSPACE — BACKEND & ARCHITECTURAL AUDIT
**Repository:** `vinastra-aerospace`  
**Date:** October 19, 2026  
**Auditor:** Automated Full-Stack Audit Agent  
**Branch:** `dev`  
**Production URL:** https://vinastra-aerospace.vercel.app  

---

## 1. Executive Summary

An exhaustive technical audit of the Vinastra Aerospace codebase reveals that the application currently operates as a **hybrid static presentation website with client-side Firebase Auth and a minimal vanilla Node.js HTTP server**.

While the visual design, interactive 3D simulations (video loops), GSAP animations, technical diagrams, and responsive layouts are well developed, **none of the production backend infrastructure, authenticated dashboards, role-based access control, server-side data persistence, or administrative portals currently exist.**

### Key Critical Findings:
1. **Zero Server-Side Authentication / Authorization:** No JWT verification, session middleware, or Firebase Admin SDK exists on the server. All routes and static files are served without authentication checks.
2. **Critical Data Exposure Risk:** In `server.js`, `GET /data/inquiries.json` can be fetched through the static file handler, exposing submitted contact forms, names, emails, and inquiries.
3. **Sensitive Corporate & Identity Documents in Web Root:** Documents such as `PAN CARD VINASTRA AEROSPACE.pdf`, `certificate of incorporation.pdf`, `msme udayam certificate.pdf`, and investor presentations are located directly in the workspace root.
4. **Vercel Serverless Read-Only Filesystem Incompatibility:** The `/api/contact` route relies on local file writes (`fs.writeFile`), which will crash with `EROFS` in a Vercel production serverless deployment.
5. **Simulated Authentication Fallback:** In `firebase-auth.js`, if Firebase Email/Password auth is unconfigured in the Firebase console, the app falls back to a synthetic local UID (`ascs-usr-XXXXXXXX`) in `localStorage` that does not persist across devices and bypasses server validation.
6. **No Sub-page Server-Side Logic:** Every single sub-page (`about`, `investors`, `login`, `research`, etc.) consists purely of static HTML files; `create-account` and `register` are duplicate copies of `login`.
7. **No Protected Mission Control or Dashboards:** Post-login dashboards for students, researchers, engineers, and investors, as well as the `/mission-control/admin` administration portal, are completely missing.

---

## 2. Component-by-Component Audit

### Component 1: Authentication & Identity Management
- **Existing Implementation:** [`firebase-auth.js`](file:///home/lakshyniti/Downloads/vinastra-aerospace-main/firebase-auth.js) (778 lines). Uses client-side Firebase JS SDK v10.12.0 (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `onAuthStateChanged`). Injects a floating modal overlay (`#vinastra-auth-modal-overlay`) and updates navigation badges.
- **Status:** **PARTIAL / UI ONLY**
- **Critical Flaws:**
  - Firebase project `vinastra-aerospace-clientside` does not have the Email/Password sign-in provider enabled in the Firebase Console, triggering `auth/configuration-not-found`.
  - Fallback mechanism generates a synthetic client-side UID (`ascs-usr-...`) in `localStorage` without true cryptographic password validation.
  - Zero server-side token verification or session handling in `server.js`. The server does not inspect or validate auth headers or cookies.
  - Roles (`students`, `professional`, `investor`) are selected on the client and never validated or enforced on the server.

### Component 2: Database & Data Management
- **Existing Implementation:**
  - Client-side Firestore calls in `firebase-auth.js` (`setDoc(doc(db, "users", uid), ...)`).
  - Local JSON files: `data/inquiries.json` and empty `data/users.json`.
- **Status:** **MISSING** (No server database)
- **Critical Flaws:**
  - No database connection on the server (no PostgreSQL, MongoDB, Prisma, SQLite, or Firestore Admin).
  - No database schemas or migrations for users, roles, institutions, projects, tasks, research submissions, prototypes, engineering reviews, documents, meetings, or audit logs.
  - Ephemeral disk writes on Vercel lead to data loss.

### Component 3: Application API & Business Logic
- **Existing Implementation:** [`server.js`](file:///home/lakshyniti/Downloads/vinastra-aerospace-main/server.js) (94 lines).
  - `GET /api/health` -> `{ status: "ok", service: "vinastra-aerospace" }` (**COMPLETE**)
  - `GET /api/news` -> Hardcoded 3-element JSON array (**PARTIAL**)
  - `POST /api/contact` -> Appends to `data/inquiries.json` (**PARTIAL / BROKEN ON VERCEL**)
- **Status:** **MISSING** (for all application domain workflows)
- **Missing APIs:**
  - Project CRUD (`/api/projects`)
  - Task management (`/api/tasks`)
  - Research proposals & submissions (`/api/research/submissions`)
  - Prototype tracking & engineering reviews (`/api/engineering/reviews`)
  - Institutional collaboration & university management (`/api/institutions`)
  - Document uploads & secure access (`/api/documents`)
  - Administrative user & system management (`/api/admin/*`)

### Component 4: Secure File Storage & Document Management
- **Existing Implementation:** None. Public static assets are served directly from `/public/`.
- **Status:** **MISSING**
- **Missing Capabilities:**
  - No private object storage (S3 / Cloud Storage / Supabase Storage).
  - No signed URL generation for restricted technical documents (CAD, blueprints, flight tests).
  - No file type/size validation or virus/mime checking on the server.
  - Sensitive PDFs currently sit exposed in the project root.

### Component 5: Administration & System Operations
- **Existing Implementation:** None.
- **Status:** **MISSING**
- **Missing Capabilities:**
  - No `/mission-control/admin` interface.
  - No server-side role assignment or revocation.
  - No review approval queues (research, engineering, institutional partnerships).
  - No audit logs for sensitive operations.
  - No system health or database metrics.

### Component 6: Dashboards (Post-Login)
- **Existing Implementation:** None. Logging in only displays a profile telemetry card in the modal or on `/login/`.
- **Status:** **MISSING**
- **Missing Capabilities:**
  - Student dashboard (assignments, prototype uploads, mentor feedback).
  - Researcher dashboard (research projects, literature reviews, submissions).
  - Engineer dashboard (CAD revisions, prototype milestones, design-review workflows).
  - Investor dashboard (authorized public/seed materials, milestone tracking; strictly gated from proprietary CAD/financials).

---

## 3. Deployment Configuration Audit
- **Vercel Config:** [`vercel.json`](file:///home/lakshyniti/Downloads/vinastra-aerospace-main/vercel.json) routes `/(.*)` to `server.js` using `@vercel/node`.
- **Flaw:** Routing all static assets (including video `satelite_element.mp4`) through a serverless function causes unnecessary latency and cost.
- **Environment Secrets:** No `.env` or `.env.example` file exists in the repository.

---

## 4. Architectural Decision & Action Plan

To support both **local development** (`node server.js`) and **Vercel serverless deployment** without external paid infrastructure blockers:
1. **Robust Embedded & Cloud-Ready Data Layer:**
   - Implement an extensible database abstraction layer with an in-memory/JSON store with atomic writes for local/testing and environment variable hooks for PostgreSQL/Cloud Firestore Admin.
2. **Server-Side Authentication & Session Middleware:**
   - Implement token/session verification middleware in `server.js`.
   - Support session cookies/bearer tokens with cryptographic signature (HMAC-SHA256).
   - Server-enforced Role-Based Access Control (RBAC): `STUDENT`, `RESEARCHER`, `ENGINEER`, `INVESTOR`, `ADMIN`, `FOUNDER`.
3. **Application API Suite:**
   - Implement comprehensive modular API routers for Auth, Users, Institutions, Projects, Tasks, Research Submissions, Engineering Reviews, Documents, and Admin.
4. **Secure File Storage Layer:**
   - Move sensitive legal PDFs and confidential pitch decks out of public web root into a secure data folder.
   - Restrict `.json` and sensitive extensions in `server.js` static file server.
   - Implement secure metadata-backed document management with access permissions.
5. **Mission Control Dashboards:**
   - Build a unified, responsive Mission Control Dashboard (`/mission-control/`) with dynamic role-tailored viewports (Student, Researcher, Engineer, Investor).
6. **Centralized Administration Portal:**
   - Build `/mission-control/admin/` with user management, role elevation, institution management, research review queue, engineering approval queue, and audit trail logs.
