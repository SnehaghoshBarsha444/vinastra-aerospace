# VINASTRA AEROSPACE — Design System

## Brand intent
Present VINASTRA as an ambitious aerospace R&D and advanced engineering venture focused on space technology, manufacturing concepts, autonomous robotics, AI, resource processing, and space infrastructure. The site should feel technically credible and premium, not like a generic SaaS template or weapon/drone landing page.

## Logo and reference image
The supplied image depicts a metallic inverted-V/inverted-pyramid emblem, space-factory imagery, orbital paths, blue illumination, and restrained gold. Preserve the supplied artwork as-is. Do not assume the full image is a transparent logo. Use a separate original SVG/transparent PNG if available; do not redraw or distort the brand mark.

## Palette
- Deep Space `#050B16`: cinematic backgrounds
- Navy `#071426`: primary brand background
- Midnight Blue `#0B1F3A`: panels/sections
- Aerospace Blue `#2864A8`: primary actions
- Electric Blue `#4CAEFF`: highlights
- Blueprint Cyan `#75DDF4`: technical lines
- White `#FFFFFF`: primary text on dark backgrounds
- Silver `#C7D0DC`: secondary text
- Restrained Gold `#C7A66A`: small premium accents
- Surface `#101C2D`; Border `#26364B`

Use gold sparingly and maintain contrast. Reuse the repository’s suitable font system; otherwise choose a legible modern sans-serif. Use monospaced type only for useful technical metadata.

## Public navigation
Home, About, Vision, Technologies, Projects/Research, Space Factory, Collaborations, Careers, News, Contact, plus a distinct Team Workspace link.

## Homepage
- Cinematic but readable hero, with the provided artwork where suitable.
- Subtle orbital arcs, engineering grid details, sparse particles, and controlled light sweeps.
- Headline about building the future beyond Earth.
- Concise description of research and technology ambitions without unverified claims.
- CTAs: `Explore Our Vision`, `Discover Our Research`, and separate `Team Workspace`.
- Keep text accessible HTML, not baked into artwork.

## Public story sections
1. About VINASTRA
2. Vision and long-term mission
3. Technologies: autonomous robotics, AI, advanced manufacturing, resource processing, communications, thermal control, power
4. Projects and research
5. Space Factory Master Blueprint
6. University/institutional collaborations
7. Careers
8. News and updates
9. Contact/partnership enquiry

Distinguish proposed concepts from active projects and verified achievements. Do not invent metrics, missions, partners, or publications.

## Motion language
Use slow parallax, orbital paths, subtle metallic light sweeps, section reveals, blueprint-to-colour transitions only when matching source layers exist, and subsystem callouts. Keep motion reversible, non-blocking, and purposeful. No scroll hijacking. No autoplay sound. Provide reduced-motion and WebGL fallbacks.

## Private workspace
Prioritize clarity over cinematic effects. Use a navy shell, clear panel boundaries, readable status labels, filters/search, and responsive tables/cards. Important actions require confirmation. Public and private navigation must remain distinct.

### Modules
- Dashboard: authorized announcements, tasks, deadlines, projects, milestones, activity.
- R&D Lab: ideas, hypotheses, literature reviews, experiment reports.
- Prototype Development: owner, milestones, version history, status.
- Space Factory Design: robotic construction, manufacturing, power, communications, thermal control, resource processing, material handling, ground supervision.
- Document Library: private CAD, reports, papers, simulation results, source code, presentations; metadata, version, uploader, project, permissions.
- Task Management: assignee, deadline, priority, status, project, comments, history.
- Meetings: timezone, agenda, authorized meeting link, attendees.
- Innovation Hub: problem, solution, feasibility, resources, risks, attachments.
- Engineering Review: `Draft → Technical Review → Approved for Testing → Tested → Revised or Closed`.
- Learning Center, Progress Reports, Administration and audit records.

## Authentication experiences
Central entry: `VINASTRA Mission Control`, `VINASTRA Internal Team`, `University / College Partner`, `External Research Advisor`. Route users using verified session and server-side membership, not a user-selected role alone.

University users see assigned projects, assignments, deadlines, project discussions, file submission, mentor feedback, progress, and meetings. Students see their assignments, permitted resources, submissions, feedback, and progress. Advisors see only explicitly shared projects. No university sees another’s data without explicit authorization.

## Responsive and accessible
Mobile navigation must work without hover. Keep hero text readable at every size. Constrain text line length on wide screens. Use keyboard access, visible focus, labels, contrast, reduced-motion, and useful loading/empty/error/denied states.
