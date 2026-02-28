# Product Context

> **Maintained by:** Librarian agent (`.claude/agents/librarian.md`)
> **Read when:** Making feature decisions, evaluating UX tradeoffs, or writing issue descriptions

## What Castparty Is

Castparty is an **ATS (Applicant Tracking System) for the performing arts casting process**. Just as an ATS manages the recruiting pipeline for jobs — from job posting through interviews to offers — Castparty manages the casting pipeline for productions, from audition announcements through callbacks to final casting decisions.

The analogy holds at every level:

| Casting | Recruiting equivalent |
|---------|----------------------|
| Production | Job requisition |
| Audition / submission | Application |
| Callback | Interview round |
| Role | Position / opening |
| Casting director | Recruiter / hiring manager |
| Performer | Candidate |
| Casting decision / offer | Offer letter |

Use this mental model when reasoning about data models, workflows, and edge cases. Recruiting has decades of established UX patterns — when in doubt, look at how ATS tools handle the analogous problem.

## Market Strategy

**Current stage:** Community theatre and small-scale productions. These productions are underserved — they run on spreadsheets, email threads, and word of mouth. We win here by offering a polished, approachable tool at a price point (or free tier) that works for volunteer-run organizations.

**Future stage:** Move upmarket to mid-size regional theatre, film/TV casting, and professional productions once we have traction. The core workflow is the same; upmarket adds collaboration, permissions, and integration depth.

This sequencing matters for feature decisions: **don't build complexity the community theatre user will never configure**. Prove the core workflow first.

## Core Personas

### Casting Director / Production Manager

Runs auditions, evaluates candidates, coordinates callbacks, and makes final casting decisions. Often wears many hats — may also be director, producer, or stage manager.

**Needs:**
- Organize a high volume of applicants without a dedicated admin
- Quickly compare candidates across roles
- Track the status of every applicant through multiple rounds
- Communicate decisions professionally without a lot of manual effort

**Pain points today:** Spreadsheets break at volume; email is unsearchable; decisions live in the casting director's head.

### Performer / Auditioner

Submits headshots, résumés, and audition materials. Tracks their status. Receives callback invitations and final decisions.

**Needs:**
- A clear, frictionless submission experience
- Confidence that their materials were received
- Timely, professional communication from the production

**Pain points today:** Submissions disappear into email inboxes; no visibility into status; inconsistent communication from productions.

## North Star

> Make casting as smooth and professional as recruiting — giving every production, no matter how small, tools that used to require industry connections or expensive software.

## Product Thinking Guidelines

### UX standards for the target persona

Community theatre users are non-technical and time-constrained. Design accordingly:

- **One primary action per screen.** Minimize cognitive overhead.
- **Forgiving workflows.** Prefer draft states, soft deletes, and undo over destructive permanent actions.
- **Clarity over density.** Plain language and whitespace over feature-packed UIs.
- **Mobile-aware.** Performers often submit on phones; casting directors review on tablets.
- **Trust signals matter.** A polished UI reflects well on the production — it's part of the product.

### Questions to answer before building any feature

1. **Who benefits?** Casting director, performer, or both?
2. **What specific friction does this remove?**
3. **Does this fit our current stage?** Would a 10-person volunteer production actually use this?

If the answer to (3) is no, flag it before implementing and propose a simpler alternative.

### Raise concerns upfront

Examples of things worth questioning before building:

- Advanced automation that a volunteer production would never configure
- Admin dashboards or analytics before the core workflow is solid
- Social/community features before private workflow is trusted
- Complex permission systems before multi-user collaboration is even needed
