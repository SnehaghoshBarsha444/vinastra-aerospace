# VINASTRA AEROSPACE — Autonomous Space Construction System (ASCS)

[![Platform Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://vinastra-aerospace.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Dual%20Architecture-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue)](LICENSE)

> **Enterprise-Grade Aerospace Research & Collaboration Platform**
> 
> Building the future of autonomous orbital assembly, inspection, and maintenance operations.

---

## 🚀 Overview

VINASTRA Aerospace is developing the **Autonomous Space Construction System (ASCS)** — a revolutionary platform for in-space manufacturing and assembly operations. This repository contains the complete web platform for:

- **Research Collaboration** with universities and academic institutions
- **Innovation Submission Portal** for students and researchers
- **Engineering Review System** with state machine workflows
- **Mission Control Admin Portal** for team management
- **Space Factory Master Blueprint** for subsystem tracking
- **Investor Workspace** with confidential document access

### Live Platform

- **Production:** [https://vinastra-aerospace.vercel.app/](https://vinastra-aerospace.vercel.app/)
- **Mission Control:** [https://vinastra-aerospace.vercel.app/mission-control](https://vinastra-aerospace.vercel.app/mission-control)
- **Space Factory:** [https://vinastra-aerospace.vercel.app/space-factory](https://vinastra-aerospace.vercel.app/space-factory)

---

## ✨ Features

### 🔐 Dual Firebase Architecture

- **Client Project** (`vinastra-aerospace-clientside`) — User authentication, profiles, public data
- **Admin Project** (`vinastra-aerospace-serverside`) — Confidential operations, audit logs, admin data
- **Server-side token verification** with Firebase Admin SDK
- **Real-time Firestore sync** for live dashboard updates

### 👥 Role-Based Access Control (RBAC)

11 distinct roles with granular permissions:

- **FOUNDER** — Full system access
- **ADMIN** — Platform administration
- **CTO** — Technical oversight
- **RD_LEAD** — Research & Development leadership
- **ENGINEER** — Technical contributions
- **RESEARCHER** — Academic research
- **COORDINATOR** — University coordination
- **FELLOW** — Research fellowship
- **STUDENT** — Academic participation
- **ADVISOR** — Strategic guidance
- **INVESTOR** — Investor-safe content access

### 📊 Dashboard & Workspaces

#### Student Dashboard
- Project assignments and tasks
- Research submission tracking
- Learning resources
- Meeting calendar (planned)

#### Researcher Dashboard
- Research project management
- Submission review queue
- Institution collaboration
- Publication tracking

#### Engineering Dashboard
- Engineering review queue
- Component testing workflows
- Technical documentation
- Prototype milestones

#### Investor Dashboard
- Investment brief access
- Milestone tracking
- Financial projections
- Founder contact

### 🏭 Space Factory Master Blueprint

Real-time tracking of ASCS subsystems:

- **6-DoF Robotic Manipulator Arm**
- **Metrology & Vision System**
- **Orbital Test Cell Platform**
- **Motion Planning & Control**
- **End Effector Tool Changer**
- **Power Management System**
- **Communications & Telemetry**
- **GNC & Propulsion Module**

### 🔬 Research & Innovation Portal

Complete submission workflow:

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/REVISION_REQUESTED
```

Features:
- Abstract submission
- Methodology documentation
- File attachments
- Reviewer feedback
- Version history

### ⚙️ Engineering Review System

Aerospace-grade review workflow:

```
TECHNICAL_REVIEW → APPROVED_FOR_TESTING → TESTED → CLOSED
```

With automatic disclaimer enforcement:
> "Approval for testing represents validation for controlled ground test cell only and does not constitute flight qualification."

---

## 🏗️ Architecture

### Technology Stack

- **Frontend:** Vanilla JavaScript, Tailwind CSS, Custom CSS
- **Backend:** Node.js 20.x with ES Modules
- **Database:** In-memory JSON with Firestore sync
- **Authentication:** Firebase Auth + Custom JWT (PBKDF2-SHA512)
- **Storage:** Firebase Storage (ready for integration)
- **Hosting:** Vercel (serverless-compatible)
- **Real-time:** Firebase Firestore listeners

### Project Structure

```
vinastra-aerospace/
├── backend/
│   ├── api.js           # REST API dispatcher (24+ endpoints)
│   ├── db.js            # In-memory JSON database
│   ├── crypto.js        # Password hashing, JWT signing
│   └── rbac.js          # Role-based access control
├── src/lib/firebase/
│   ├── admin.js         # Firebase Admin SDK (dual project)
│   ├── client.js        # Firebase Client SDK (browser)
│   ├── storage.js       # File upload/download module
│   └── firestore-sync.js # Real-time sync engine
├── mission-control/      # Admin portal UI
├── space-factory/        # Blueprint UI
├── innovation-portal/    # Submission UI
├── data/
│   ├── db.json          # Persistent data store
│   └── secure_vault/    # Confidential documents
├── public/              # Static assets
├── server.js            # Production server
└── vercel.json          # Vercel configuration
```

### API Endpoints

#### Authentication (`/api/auth/*`)
- `POST /register` — User registration
- `POST /login` — User login
- `POST /logout` — Session termination
- `GET /me` — Current user profile
- `POST /forgot-password` — Password reset request
- `POST /reset-password` — Password reset completion

#### Projects (`/api/projects/*`)
- `GET /` — List accessible projects
- `GET /:id` — Project details
- `POST /` — Create project (engineer+)

#### Tasks (`/api/tasks/*`)
- `GET /` — List assigned tasks
- `POST /` — Create task
- `PUT /:id` — Update task

#### Research (`/api/research/*`)
- `GET /submissions` — List submissions
- `POST /submissions` — Create submission
- `POST /submissions/:id/review` — Review submission

#### Engineering (`/api/engineering/*`)
- `GET /reviews` — List engineering reviews
- `POST /reviews` — Create review
- `POST /reviews/:id/decision` — Record decision

#### Space Factory (`/api/space-factory/*`)
- `GET /subsystems` — List all subsystems
- `GET /subsystems/:id` — Subsystem details
- `PUT /subsystems/:id` — Update subsystem

#### Admin (`/api/admin/*`)
- `GET /metrics` — System metrics
- `GET /users` — List all users
- `POST /users/:id/role` — Update user role
- `POST /users/:id/status` — Suspend/activate user
- `GET /audit-logs` — Security audit trail

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Firebase account (for production)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/vinastra-aerospace.git
cd vinastra-aerospace

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm start
```

The server will start at `http://localhost:4174`

### Environment Variables

See `.env.example` for all required variables:

```bash
# Server
PORT=4174
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here

# Firebase Client Admin
FIREBASE_CLIENT_ADMIN_PROJECT_ID=vinastra-aerospace-clientside
FIREBASE_CLIENT_ADMIN_CLIENT_EMAIL=...
FIREBASE_CLIENT_ADMIN_PRIVATE_KEY="..."

# Firebase Admin (optional)
FIREBASE_ADMIN_PROJECT_ID=vinastra-aerospace-serverside
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="..."
```

### Demo Accounts

Five demo accounts are pre-configured:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vinastra.space | admin123 |
| Engineer | engineer@vinastra.space | eng123 |
| Researcher | researcher@vinastra.space | res123 |
| Student | student@university.edu | stu123 |
| Investor | investor@fund.com | inv123 |

---

## 📖 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** — Complete production deployment instructions
- **[Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md)** — Firebase configuration details
- **[Implementation Status](VINASTRA_IMPLEMENTATION_STATUS.md)** — Feature completion tracking
- **[Backend Audit](VINASTRA_BACKEND_AUDIT.md)** — Technical architecture review
- **[Complete Audit Report](VINASTRA_AUDIT_REPORT.md)** — Comprehensive system analysis

---

## 🧪 Testing

```bash
# Run manual verification
node tests/verify-site.js

# API health check
curl http://localhost:4174/api/health
```

Automated testing framework coming soon.

---

## 🔒 Security

### Implemented ✅

- PBKDF2-SHA512 password hashing with random salts
- HMAC-SHA256 JWT token signing
- HTTP-only cookie sessions with SameSite attribute
- Rate limiting (25 req/min on auth endpoints)
- Input validation and sanitization
- Path traversal prevention
- Privilege escalation prevention
- Role-based access control
- Audit logging for all sensitive operations

### Planned 📋

- Firebase Security Rules deployment
- Two-factor authentication
- CSRF protection
- Content Security Policy headers
- Account lockout after failed attempts

---

## 🗺️ Roadmap

### Phase 1: Core Platform (Current - 85% Complete)
- ✅ Dual Firebase architecture
- ✅ Role-based access control
- ✅ Research submission portal
- ✅ Engineering review system
- ✅ Space Factory blueprint UI
- ⏳ File upload system
- ⏳ Email notifications

### Phase 2: Enhanced Collaboration
- 📅 Real-time messaging
- 📅 Meeting calendar
- 📅 Video conferencing integration
- 📅 Document versioning

### Phase 3: Advanced Features
- 📅 AI-powered research matching
- 📅 Automated report generation
- 📅 Analytics dashboard
- 📅 Mobile application

### Phase 4: Production Hardening
- 📅 Comprehensive test suite
- 📅 CI/CD pipeline
- 📅 Performance optimization
- 📅 Security audit

---

## 🤝 Contributing

This is a proprietary project. For collaboration inquiries:

- **Email:** flight-ops@vinastra.space
- **Website:** [https://vinastra.space](https://vinastra.space)

---

## 📄 License

Proprietary — All rights reserved.

VINASTRA Aerospace Pvt. Ltd.  
Copyright © 2026

---

## 📞 Contact

**VINASTRA Aerospace**

- **Website:** [vinastra.space](https://vinastra.space)
- **Email:** flight-ops@vinastra.space
- **LinkedIn:** [VINASTRA Aerospace](https://linkedin.com/company/vinastra-aerospace)

---

**Building the future of autonomous space construction.** 🚀
