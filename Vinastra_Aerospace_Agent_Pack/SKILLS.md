# VINASTRA AEROSPACE — Skills & Engineering Playbook

Adapt these patterns to the repository’s actual stack. Do not add libraries or migrate architecture without a clear reason.

## 1. Repository audit
Identify framework/version, package manager, routes, design system, animations, auth provider, database/migrations, object storage, email/invitations, tests, environment variables, and deployment scripts. Record baseline build/test status before changes.

## 2. Motion graphics
Motion should explain scale, orbital movement, subsystem relationships, or storytelling. Prefer transforms and opacity; use scroll-linked motion sparingly and keep it reversible. Respect reduced-motion preferences. Avoid scroll locking, autoplay audio, excessive bloom/particles, and long blocking intros. Keep text accessible HTML, not embedded in canvas.

For the hero, layer artwork, orbital paths, subtle grid/particles, light sweeps, text, and CTAs. Do not pretend a flat image is a rotatable 3D model. Load heavy 3D dynamically and provide a static fallback when WebGL fails.

## 3. Frontend architecture
Reuse existing components and conventions. Separate presentation from data access and authorization. Keep public navigation separate from private workspace navigation. Use semantic HTML, typed props, labelled inputs, reusable cards/tables/dialogs/status chips, and proper loading/empty/error states.

## 4. Suggested data entities
Compare with existing schema before implementing: User, Institution, Membership, Role/Permission, Project, ProjectMembership, Task, ResearchSubmission, InnovationProposal, EngineeringReview, DocumentMetadata, Meeting/Event, ProgressReport, Announcement, Invitation, AuditEvent. Do not blindly create every entity; implement the minimum viable model first.

Every protected query must derive identity from a trusted server-side session. Never trust client-supplied `userId`, `role`, `institutionId`, or `projectId` without verifying access. Apply authorization to list/detail queries, uploads, downloads, edits, deletes, exports, search, and background jobs.

## 5. Permissions
Centralize permission checks, for example `projects.read`, `tasks.assign`, `submissions.create`, `submissions.review`, `documents.upload`, `documents.read`, `documents.delete`, `reviews.approve`, `users.manage`, and `audit.read`. These are conceptual names; match the repo’s conventions.

- Founder/Admin: broad control, with audit safeguards.
- CTO/Technical Lead: technical planning and designated reviews.
- R&D Lead: assigned department projects and research.
- Researcher/Engineer: assigned projects and permitted files.
- Fellow/Intern: assigned tasks and authorized resources.
- University Coordinator/Professor: own institution’s authorized projects and students.
- Student: own assignments, submissions, feedback, and granted resources.
- External Advisor: explicitly shared projects only.
- Operations/Management: explicitly granted coordination/report areas.

University A must not see University B’s data by default. Students must not see other students’ private submissions by default. Revoked memberships must remove access.

## 6. Secure documents
Use private object storage. Keep metadata separate from file bytes. Generate storage keys. Validate extension, MIME type, and size. Do not rely on filenames alone. Use short-lived signed download URLs after authorization. Track uploader, project, timestamp, version, and permissions. Consider malware scanning. Define retention/deletion behaviour honestly; backups or legal retention can affect immediate deletion guarantees.

## 7. Research workflows
Innovation submissions capture problem, proposed solution, feasibility/assumptions, required resources, risks, dependencies, supporting documents, project/institution scope, and status.

Engineering review transitions:
`Draft → Technical Review → Approved for Testing → Tested → Revised or Closed`

Only authorized reviewers can transition states. Record reviewer, timestamp, decision, comments, and revision history. “Approved for Testing” is not “flight-ready”.

## 8. QA checklist
Test logged-out denial, university isolation, student submission privacy, advisor access restrictions, review permissions, revoked users, file-download authorization, validation/errors, reduced-motion behaviour, WebGL fallback, and mobile layouts. Run only scripts actually present in the repo and report their real results.

## 9. Uncertainty
When requirements are incomplete, preserve existing behaviour, choose the safest reversible option, document assumptions, and ask before irreversible, costly, or security-sensitive changes.
