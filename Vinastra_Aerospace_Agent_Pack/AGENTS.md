# VINASTRA AEROSPACE — Agent Instructions

## Mission
Upgrade the existing repository into a premium, motion-rich public aerospace website and a secure, role-based private collaboration workspace. Inspect the repository before changing it. Preserve the current framework, working features, brand assets, and deployment setup unless a change is justified and approved.

## Read first
Read `SKILLS.md`, `DESIGN.md`, and `PLAN.md` before major implementation. Keep these files aligned with the actual codebase.

## Product surfaces
**Public website:** Home, About, Vision, Technologies, Projects/Research, Space Factory, Collaborations, Careers, News, Contact, and a distinct Team Workspace entry.

**Private workspace:** Mission Control login, internal team dashboard, university/college dashboard, student dashboard, external advisor dashboard, R&D Lab, prototype tracking, Space Factory Design, document library, tasks, collaboration, meetings, innovation submissions, engineering reviews, learning resources, progress reports, and administration.

## Mandatory rules
1. Audit framework, routes, components, assets, auth, database, storage, tests, and deployment before editing.
2. Do not replace the project with a new starter app or migrate frameworks without approval.
3. No fake functionality, fabricated API success, invented metrics, fake partners, publications, missions, or achievements.
4. Authorization must be enforced server-side, not only by hiding UI.
5. Scope data by both role and project/institution membership.
6. Never commit secrets, credentials, real private documents, or production `.env` files. Provide `.env.example` with placeholders.
7. Treat uploads as untrusted: validate file type and size, use generated storage keys, keep confidential files private, and authorize every download.
8. Never store or email plaintext passwords. Prefer the existing trusted auth provider.
9. Do not run destructive database or deployment commands without explicit approval.
10. Support keyboard use, semantic HTML, visible focus, readable contrast, responsive layouts, and `prefers-reduced-motion`.
11. Provide a static fallback if WebGL or video fails. Motion must not trap scrolling or hide essential content.
12. Never label a concept “validated”, “flight-ready”, or “approved” without an authorized review record.
13. Do not claim certifications, legal compliance, or guaranteed security without evidence.
14. Report exact tests and build commands run. Never claim a check passed if it was not run.

## Brand
Use the supplied VINASTRA emblem image as a reference asset. Preserve the original artwork. Do not distort or redraw it. The supplied image may be a full scene, not a transparent logo; use a separate SVG/PNG logo if available.

## Roles
Founder/Super Admin; CTO/Technical Lead; R&D Lead; Researcher/Engineer; Fellow/Intern; University Coordinator/Professor; Student; External Research Advisor; Operations/Management. Centralize permission rules. A role alone must not grant access to every project.

## Invitation flow
Admin creates/approves invitation → time-limited invitation to verified email → member sets their own password → admin assigns institution, role, and project permissions → activation/security events are recorded. Do not email passwords.

## Implementation workflow
Inspect → state approach → make a coherent change → add validation/access checks/tests → run formatter/lint/typecheck/tests/build available → fix regressions → report changed files, checks, limitations, and manual setup.

## Definition of done
A feature is done when UI, real data/action path, server authorization, loading/empty/error/denied states, responsive behaviour, and relevant tests are implemented. If it is only a prototype, label it clearly.
