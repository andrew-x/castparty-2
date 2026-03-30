# Product Context

> **Maintained by:** Librarian agent (`.codex/agents/librarian.toml`, `.claude/agents/librarian.md`)
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

## Business Target

**Revenue goal:** $300K CAD ARR (~$220K USD).

**Path to get there (hybrid model):**

- **Free tier** for community theatre: 1 production at a time, 2 team members, basic submission/review workflow. Builds brand, generates word-of-mouth, creates a pipeline of users who cross over into professional work.
- **Pro tier (~$65 CAD/month):** Unlimited productions, unlimited team members, scheduling, analytics, custom forms. Targets serious community theatre and semi-professional organizations.
- **Organization tier (~$260 CAD/month):** Season management, shared talent database across productions, agent/representation support, API access, priority support. Targets regional and professional theatre.

**Target math:** ~100 Pro accounts ($78K CAD) + ~40 Organization accounts ($125K CAD) + annual prepay and expansion revenue closes the gap. That's ~140 paying customers within 2-3 years.

**Go-to-market sequence:**

1. Seed 20-30 community theatres on the free tier. Learn what breaks, what's missing, what they love. Acquire through Facebook groups, AACT network, and direct outreach.
2. Launch paid tiers based on real demand signals from free users. Start a content engine (blog, podcasts, theatre newsletters).
3. Target professional theatres directly with case studies from community productions. Lean on the cross-pollination between community and professional theatre (directors, stage managers, and designers who work in both worlds).

## Competitive Landscape

### Tier 1: Entrenched Professional Platforms

**Breakdown Services / Actors Access** -- Founded 1971, handles 97%+ of scripted casting in North America. The de facto standard for professional film/TV/theatre. Free actor profiles, $68/year for unlimited self-submissions. Agent-to-CD pipeline is the core workflow. Privately held, opaque financials. Dated UX but unassailable market position due to network effects.

**Casting Networks** -- Main competitor to Breakdown Services, strong in commercial casting. ~350 employees, estimated $40-70M USD revenue, backed by RedBird Capital and StepStone Group. Investing in mobile self-tape tools and AI search. Currently generating industry backlash over $400/month agent subscription fees (3,000+ petition signatures, SAG-AFTRA involvement, potential California law violations). The resentment creates a window for alternatives.

**Spotlight (UK)** -- Gold standard for British casting since 1927. Membership ~$130-200/year for performers, requires professional credentials. Not directly competitive unless we expand internationally.

**Relevance to Castparty:** These are two-sided marketplaces with deep network effects. We cannot and should not compete head-on. They assume agents, subscriptions, and industry-scale workflows. Our product serves a different need.

### Tier 2: Production Management Platforms (Casting as a Feature)

**StudioBinder** -- Production management tool (call sheets, shot lists, scheduling) with casting as one module. $42-127/month. Well-funded, strong content marketing. Casting is decent but not their focus. Targets indie film and mid-size production companies.

**ProductionPro** -- Theatre-focused production management (digital scripts, blocking, rehearsal scheduling). $29-49/month per production. Partnership with Music Theatre International (MTI) gets them into schools and community theatres through show licensing. Casting features are minimal. Adjacent to our market and a potential distribution channel model to learn from.

**Relevance to Castparty:** These treat casting as secondary. We go deeper on the casting workflow. Risk: one of them builds out casting. Opportunity: we could complement them.

### Tier 3: Direct Competitors (Our Space)

**Cast98** -- Most direct competitor. Built by a community theatre actor for schools and community theatre. Free tier includes audition management, casting, rehearsal scheduling, and digital playbills. Paid at $50/month. Standout features: audition scheduling with time slots, conflict calendar management, collaborative scoring. Their scheduling and conflict workflow is ahead of ours. Our submission review and pipeline management is more sophisticated than theirs.

**Auditions Manager** -- Simpler tool focused on audition scheduling and online submissions. Time slot management, online registration. Less featured than Cast98, same market.

**Audition Magic** -- Broader target (studios, theatres, ad agencies, cruise lines, theme parks). Audition scheduling, live iPad capture, shortlists. Pricing not public, likely more expensive and enterprise-oriented.

**Relevance to Castparty:** Cast98 is the one to watch. They have a head start in community theatre, especially on scheduling. We differentiate on the submission pipeline and review workflow. The market may split by which part of the workflow matters most to a given organization.

### Tier 4: Marketplace / Job Boards

**Backstage** (owns Mandy + StarNow) -- Owned by Cast & Crew, ~160 employees, ~$40M USD revenue. Global casting marketplace with 1M+ members. Performers pay $17-25/month, CDs pay $25/job posting. Self-tape support (direct upload up to 2GB + YouTube/Vimeo links). Strong in discovery: actors finding roles.

**Relevance to Castparty:** Complementary, not competitive. A CD posts on Backstage to attract submissions, then manages them in Castparty. Being the tool that a Backstage posting links to is a smart distribution play.

### Tier 5: Background / Extras Casting

Background/extras casting is a distinct workflow from principal casting but shares core data model problems: managing large pools of people with attributes, tracking them through statuses, communicating decisions, and coordinating logistics. The scale is much larger (agencies manage thousands to hundreds of thousands of registered extras) and the per-person evaluation is lighter (physical attributes and availability, not audition quality).

**The workflow:** Agency maintains a talent database with photos and physical attributes. Production requests specific types ("50 office workers, 30s-40s, next Tuesday"). Agency searches/filters database, checks availability (often via mass text), confirms bookings, generates call sheets, handles on-set check-in/check-out, processes vouchers (timecards), and submits to payroll.

**Pain points:** Smaller independent agencies (500-5,000 registered extras) are especially underserved. They manage talent in spreadsheets, handle booking via email/phone tag, lose paper vouchers, and have no good way to search their pool by specific attributes at scale.

**Everyset** -- The heavyweight. Works with Netflix, Amazon, HBO, Paramount, Apple. Focuses on on-set workflow: digital vouchers, check-in/check-out, payroll integration. Enterprise-grade, no public pricing, sales-driven. 24/7 support.

**Entertainment Partners Casting Portal** -- End-to-end background talent management and digital voucher solution for Canada, UK, and Ireland. Search, book, manage, pay from one place. Also enterprise.

**HeyCast** -- Mid-market SaaS covering registration through payroll. Cloud-based, pricing based on "mandays" (bookings confirmed). Serves both casting directors and talent agencies. More accessible than Everyset but still targets film/TV production.

**Casting42** -- Most relevant to Castparty's potential expansion. Customizable casting database scaling from free (40 talents) up to 250K talents. Explicitly targets extras agencies and commercial casting alongside traditional CDs. Features: talent self-registration, availability checking, SMS/texting, bulk notifications, GDPR tools, AI processing. Pricing tiers scale by database size.

**Production Tools** -- Centralized talent database with bulk notifications, online casting forms, and self-tape collection. Similar to Casting42 but less polished.

**Central Casting** -- The industry institution. 200,000 registered extras, places ~3,000/day. Not a software competitor but sets the workflow expectations for the segment. Uses Everyset's SmartVoucher technology.

**Relevance to Castparty:** This is a viable expansion path, potentially faster to revenue than the community-to-professional theatre pipeline because extras agencies have actual budgets and immediate pain points. A small extras agency would pay $100-300/month for a tool that replaces their spreadsheet database, handles availability checking, and streamlines booking. The core data model (people with attributes, organized into projects, moving through statuses) overlaps significantly with what we've already built. Two possible approaches: (1) a separate module/product sharing infrastructure, or (2) a "talent database" feature that bridges principal and background casting for agencies that do both.

### Key Competitive Takeaways

1. There is a real gap between the professional platforms (agent-driven, subscription-based) and community theatre tools (scheduling-focused, limited pipeline management).
2. Cast98 is the most direct threat and has a head start on scheduling/conflicts. We need scheduling.
3. Casting Networks' agent fee controversy is creating resentment and openness to alternatives in the professional tier.
4. Discovery/marketplace is dominated by Backstage and Breakdown Services. Integrate with them rather than trying to replace them.
5. Community theatre directors who also work professionally are the bridge to the upmarket segment. Win them on free, they'll advocate for paid.
6. Background/extras casting is a real expansion opportunity. The workflow differs but the underlying data problems overlap with our core product. Small-to-mid extras agencies are underserved by the enterprise tools (Everyset, EP) and could pay meaningful SaaS prices. Casting42 is the closest existing product to what we'd build here.
