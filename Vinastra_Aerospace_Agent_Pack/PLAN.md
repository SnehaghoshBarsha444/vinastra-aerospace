# VINASTRA AEROSPACE — Implementation Plan

## Goal
Upgrade the existing codebase into a motion-rich public aerospace website and a secure multi-role workspace. Build incrementally; do not create many disconnected mock screens.

## Phase 0 — Audit
- Inspect repo, stack, routes, assets, auth, database, storage, tests, and deployment.
- Inspect the supplied image and locate a separate logo if available.
- Run existing lint/typecheck/tests/build and record baseline failures.
- Document environment variables without exposing secrets.
**Exit:** architecture summary and known blockers recorded; existing behaviour preserved.

## Phase 1 — Architecture and security
- Map public/private routes.
- Define roles, permissions, institution membership, project membership, and resource scope.
- Compare proposed entities with existing schema.
- Design invitations, private storage, retention, and audit records.
- Document required services and environment variables.
**Exit:** permission matrix and data ownership rules reviewed; no unapproved migration.

## Phase 2 — Design foundation and public site
- Establish tokens, typography, navigation, buttons, cards, and responsive shell.
- Implement cinematic hero and public navigation.
- Build About, Vision, Technologies, Projects/Research, Space Factory, Collaborations, Careers, News, Contact.
- Add Team Workspace entry.
- Add motion only after static layouts work.
**Exit:** routes work, mobile is usable, reduced-motion and static hero fallback work, no invented claims.

## Phase 3 — Authentication
- Use the existing auth provider.
- Implement sign-in/out, invitation acceptance, verified email where supported, and session expiry.
- Create central Mission Control entry and role-based dashboard routing.
- Add centralized server-side authorization.
**Exit:** unauthenticated private access is denied; invitations expire and cannot be reused; no plaintext passwords.

## Phase 4 — Team workspace MVP
- Internal dashboard, projects, memberships, tasks, deadlines, comments, announcements, meetings, reports.
- Admin tools for accounts, roles, invitations, and project access.
**Exit:** real persistence, authorization on server, loading/empty/error states.

## Phase 5 — University and student portals
- Institution dashboard and coordinator workflow.
- Assign projects, students, professors, tasks, submissions, feedback, progress, and meetings.
- Add restricted external advisor access.
- Implement suspension and membership revocation.
**Exit:** cross-institution isolation and student privacy tests pass.

## Phase 6 — R&D and engineering
- Research Lab: ideas, hypotheses, literature reviews, experiment reports.
- Innovation Portal: problem, solution, feasibility, resources, risks, attachments.
- Prototype tracking and Space Factory subsystem repository.
- Review states: `Draft → Technical Review → Approved for Testing → Tested → Revised or Closed`.
- Record reviewer, timestamps, comments, and revisions.
**Exit:** transitions require correct permissions; no concept is mislabeled validated or flight-ready.

## Phase 7 — Document library
- Private object storage, metadata, versioning, upload validation, size limits, generated keys.
- Authorization on upload/download/edit/delete/export.
- Short-lived signed URLs and audit events where appropriate.
- Define deletion/backup/retention behaviour.
**Exit:** confidential files are not public; unauthorized downloads fail; deletion claims reflect actual system behaviour.

## Phase 8 — Collaboration modules
- Discussions, learning resources, meeting calendar, progress reports, admin/audit views.
- Add search, filters, pagination, and empty states.
**Exit:** all modules respect role and project scope.

## Phase 9 — Motion and performance
- Refine orbital motion, hero transitions, section reveals, subsystem callouts.
- Use real 3D only if assets exist and justify it.
- Lazy-load heavy scenes, prevent layout shifts, test mobile, add reduced-motion and WebGL fallbacks.
**Exit:** essential content works without animation or WebGL.

## Phase 10 — QA and release
Test:
- Logged-out access is denied.
- University A cannot read University B projects/files.
- Students cannot read unauthorized submissions.
- Advisors only see shared projects.
- Unauthorized users cannot approve reviews or manage accounts.
- Revoked users lose access.
- Private file downloads require permission.
- Forms, errors, reduced-motion, WebGL fallback, and responsive layouts work.

Run available formatter, linter, type checker, tests, and production build. Review migrations, backups, environment variables, HTTPS, email delivery, logs, and rollback options. Report actual results; do not claim “error-free”.

## Recommended MVP order
1. Audit and preserve existing project.
2. Public website and cinematic hero.
3. Authentication and secure role-based shell.
4. Projects, tasks, institution/project membership.
5. Private documents and submissions.
6. Research/innovation and engineering reviews.
7. Meetings, reports, learning center, advanced motion polish.

## Phase report template
- Completed routes/components/flows
- Files changed
- Data and security changes
- Exact commands and results
- Known limitations and missing credentials/services
- Manual setup steps
- Recommended next phase
