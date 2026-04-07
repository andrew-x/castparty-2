# Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current home page with a dashboard showing production pipeline stats, recent inbound emails, and recent comments/feedback — with a full-page empty state for new users.

**Architecture:** Three server-side query functions feed three server components (widgets). The page orchestrates data fetching with `Promise.all` and conditionally renders the empty state or the widget layout. All components are server components — no client interactivity needed.

**Tech Stack:** Next.js App Router (server components), Drizzle ORM (select API for aggregations), Tailwind CSS with semantic design tokens, existing shadcn/ui primitives.

---

## File Structure

```
src/
├── actions/
│   └── dashboard/
│       ├── get-dashboard-productions.ts   # Productions with stage-grouped submission counts
│       ├── get-recent-emails.ts           # 10 most recent inbound emails
│       └── get-recent-activity.ts         # 10 most recent comments + feedback, mixed
├── app/(app)/home/
│   └── page.tsx                           # Replace existing — orchestrate widgets or empty state
└── components/home/
    ├── productions-widget.tsx             # Full-width production cards with stage badges
    ├── emails-widget.tsx                  # Inbound email list
    └── activity-widget.tsx                # Comments + feedback mixed list
```

---

### Task 1: Dashboard Productions Query

**Files:**
- Create: `src/actions/dashboard/get-dashboard-productions.ts`

This query extends the existing `getProductionsWithSubmissionCounts` pattern but groups submission counts by pipeline stage type (APPLIED, CUSTOM, SELECTED, REJECTED).

- [ ] **Step 1: Create the query file**

```ts
// src/actions/dashboard/get-dashboard-productions.ts
"use server"

import { count, desc, eq, sql } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { PipelineStage, Production, Role, Submission } from "@/lib/db/schema"

export interface DashboardProduction {
  id: string
  name: string
  status: "open" | "closed" | "archive"
  createdAt: Date
  roleCount: number
  appliedCount: number
  inReviewCount: number
  selectedCount: number
  rejectedCount: number
}

export async function getDashboardProductions(): Promise<DashboardProduction[]> {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const roleCountSq = db
    .select({
      productionId: Role.productionId,
      count: count().as("role_count"),
    })
    .from(Role)
    .groupBy(Role.productionId)
    .as("rc")

  const appliedSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("applied_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "APPLIED"))
    .groupBy(Submission.productionId)
    .as("applied")

  const inReviewSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("in_review_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "CUSTOM"))
    .groupBy(Submission.productionId)
    .as("in_review")

  const selectedSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("selected_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "SELECTED"))
    .groupBy(Submission.productionId)
    .as("selected")

  const rejectedSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("rejected_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "REJECTED"))
    .groupBy(Submission.productionId)
    .as("rejected")

  const rows = await db
    .select({
      id: Production.id,
      name: Production.name,
      status: Production.status,
      createdAt: Production.createdAt,
      roleCount: sql<number>`coalesce(${roleCountSq.count}, 0)`,
      appliedCount: sql<number>`coalesce(${appliedSq.count}, 0)`,
      inReviewCount: sql<number>`coalesce(${inReviewSq.count}, 0)`,
      selectedCount: sql<number>`coalesce(${selectedSq.count}, 0)`,
      rejectedCount: sql<number>`coalesce(${rejectedSq.count}, 0)`,
    })
    .from(Production)
    .leftJoin(roleCountSq, eq(roleCountSq.productionId, Production.id))
    .leftJoin(appliedSq, eq(appliedSq.productionId, Production.id))
    .leftJoin(inReviewSq, eq(inReviewSq.productionId, Production.id))
    .leftJoin(selectedSq, eq(selectedSq.productionId, Production.id))
    .leftJoin(rejectedSq, eq(rejectedSq.productionId, Production.id))
    .where(eq(Production.organizationId, orgId))
    .orderBy(
      sql`CASE WHEN ${Production.status} = 'archive' THEN 1 ELSE 0 END`,
      desc(Production.createdAt),
    )

  return rows as DashboardProduction[]
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: No type errors in the new file.

---

### Task 2: Recent Emails Query

**Files:**
- Create: `src/actions/dashboard/get-recent-emails.ts`

- [ ] **Step 1: Create the query file**

```ts
// src/actions/dashboard/get-recent-emails.ts
"use server"

import { and, desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Email, Submission } from "@/lib/db/schema"

export interface RecentEmail {
  id: string
  fromEmail: string | null
  subject: string
  sentAt: Date
  submissionId: string | null
  productionId: string | null
}

export async function getRecentEmails(): Promise<RecentEmail[]> {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const rows = await db
    .select({
      id: Email.id,
      fromEmail: Email.fromEmail,
      subject: Email.subject,
      sentAt: Email.sentAt,
      submissionId: Email.submissionId,
      productionId: Submission.productionId,
    })
    .from(Email)
    .leftJoin(Submission, eq(Email.submissionId, Submission.id))
    .where(
      and(
        eq(Email.organizationId, orgId),
        eq(Email.direction, "inbound"),
      ),
    )
    .orderBy(desc(Email.sentAt))
    .limit(10)

  return rows
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: No type errors.

---

### Task 3: Recent Activity Query (Comments + Feedback)

**Files:**
- Create: `src/actions/dashboard/get-recent-activity.ts`

This query uses two separate queries (comments and feedback), merges them in-memory, and sorts by `createdAt`. This avoids raw SQL unions while keeping the logic simple.

- [ ] **Step 1: Create the query file**

```ts
// src/actions/dashboard/get-recent-activity.ts
"use server"

import { desc, eq, inArray } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Comment, Feedback, Production, Submission, User } from "@/lib/db/schema"

interface ActivityComment {
  type: "comment"
  id: string
  authorName: string
  content: string
  createdAt: Date
  submissionId: string
  productionId: string
  productionName: string
}

interface ActivityFeedback {
  type: "feedback"
  id: string
  authorName: string
  rating: "STRONG_NO" | "NO" | "YES" | "STRONG_YES"
  notes: string
  createdAt: Date
  submissionId: string
  productionId: string
  productionName: string
}

export type ActivityItem = ActivityComment | ActivityFeedback

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  // Get production IDs for this org to scope the queries
  const orgProductions = await db
    .select({ id: Production.id, name: Production.name })
    .from(Production)
    .where(eq(Production.organizationId, orgId))

  if (orgProductions.length === 0) return []

  const productionIds = orgProductions.map((p) => p.id)
  const productionMap = new Map(orgProductions.map((p) => [p.id, p.name]))

  // Fetch recent comments
  const comments = await db
    .select({
      id: Comment.id,
      content: Comment.content,
      createdAt: Comment.createdAt,
      submissionId: Comment.submissionId,
      authorName: User.name,
      productionId: Submission.productionId,
    })
    .from(Comment)
    .innerJoin(User, eq(Comment.submittedByUserId, User.id))
    .innerJoin(Submission, eq(Comment.submissionId, Submission.id))
    .where(inArray(Submission.productionId, productionIds))
    .orderBy(desc(Comment.createdAt))
    .limit(10)

  // Fetch recent feedback
  const feedbackRows = await db
    .select({
      id: Feedback.id,
      rating: Feedback.rating,
      notes: Feedback.notes,
      createdAt: Feedback.createdAt,
      submissionId: Feedback.submissionId,
      authorName: User.name,
      productionId: Submission.productionId,
    })
    .from(Feedback)
    .innerJoin(User, eq(Feedback.submittedByUserId, User.id))
    .innerJoin(Submission, eq(Feedback.submissionId, Submission.id))
    .where(inArray(Submission.productionId, productionIds))
    .orderBy(desc(Feedback.createdAt))
    .limit(10)

  // Merge and sort
  const items: ActivityItem[] = [
    ...comments.map((c) => ({
      type: "comment" as const,
      id: c.id,
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt,
      submissionId: c.submissionId,
      productionId: c.productionId,
      productionName: productionMap.get(c.productionId) ?? "",
    })),
    ...feedbackRows.map((f) => ({
      type: "feedback" as const,
      id: f.id,
      authorName: f.authorName,
      rating: f.rating as ActivityFeedback["rating"],
      notes: f.notes,
      createdAt: f.createdAt,
      submissionId: f.submissionId,
      productionId: f.productionId,
      productionName: productionMap.get(f.productionId) ?? "",
    })),
  ]

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return items.slice(0, 10)
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: No type errors.

---

### Task 4: Productions Widget Component

**Files:**
- Create: `src/components/home/productions-widget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/home/productions-widget.tsx
import Link from "next/link"
import { Badge } from "@/components/common/badge"
import day from "@/lib/dayjs"
import type { DashboardProduction } from "@/actions/dashboard/get-dashboard-productions"

interface Props {
  productions: DashboardProduction[]
}

export function ProductionsWidget({ productions }: Props) {
  const activeProductions = productions.filter((p) => p.status !== "archive")

  if (activeProductions.length === 0) return null

  return (
    <section className="flex flex-col gap-block">
      <h2 className="font-medium text-heading">Open Productions</h2>
      <div className="flex flex-col gap-block">
        {activeProductions.map((production) => (
          <Link
            key={production.id}
            href={`/productions/${production.id}`}
            className="flex flex-col gap-element rounded-lg border px-block py-block transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between gap-element">
              <div className="min-w-0">
                <h3 className="truncate font-medium text-foreground text-label">
                  {production.name}
                </h3>
                <p className="text-caption text-muted-foreground">
                  {production.roleCount}{" "}
                  {production.roleCount === 1 ? "role" : "roles"} &middot;{" "}
                  Created {day(production.createdAt).format("MMM D")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-element">
              <Badge className="bg-violet-100 text-violet-700">
                {production.appliedCount} applied
              </Badge>
              <Badge className="bg-amber-100 text-amber-700">
                {production.inReviewCount} in review
              </Badge>
              <Badge className="bg-green-100 text-green-700">
                {production.selectedCount} selected
              </Badge>
              <Badge className="bg-red-100 text-red-700">
                {production.rejectedCount} rejected
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: No errors.

---

### Task 5: Emails Widget Component

**Files:**
- Create: `src/components/home/emails-widget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/home/emails-widget.tsx
import { MailIcon } from "lucide-react"
import Link from "next/link"
import day from "@/lib/dayjs"
import type { RecentEmail } from "@/actions/dashboard/get-recent-emails"

interface Props {
  emails: RecentEmail[]
}

export function EmailsWidget({ emails }: Props) {
  return (
    <section className="flex flex-col gap-block">
      <h2 className="font-medium text-heading">Recent Emails</h2>
      {emails.length === 0 ? (
        <p className="py-section text-center text-caption text-muted-foreground">
          No inbound emails yet
        </p>
      ) : (
        <div className="flex flex-col">
          {emails.map((email) => {
            const content = (
              <div className="flex items-start gap-element border-b py-element last:border-b-0">
                <MailIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col gap-tight">
                  <div className="flex items-baseline justify-between gap-element">
                    <span className="truncate font-medium text-label text-foreground">
                      {email.fromEmail ?? "Unknown sender"}
                    </span>
                    <span className="shrink-0 text-caption text-muted-foreground">
                      {day(email.sentAt).fromNow()}
                    </span>
                  </div>
                  <p className="truncate text-caption text-muted-foreground">
                    {email.subject}
                  </p>
                </div>
              </div>
            )

            if (email.submissionId && email.productionId) {
              return (
                <Link
                  key={email.id}
                  href={`/productions/${email.productionId}?submission=${email.submissionId}`}
                  className="transition-colors hover:bg-muted/50"
                >
                  {content}
                </Link>
              )
            }

            return <div key={email.id}>{content}</div>
          })}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: No errors.

---

### Task 6: Activity Widget Component (Comments + Feedback)

**Files:**
- Create: `src/components/home/activity-widget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/home/activity-widget.tsx
import { MessageSquareIcon, StarIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/common/badge"
import day from "@/lib/dayjs"
import type { ActivityItem } from "@/actions/dashboard/get-recent-activity"

interface Props {
  activity: ActivityItem[]
}

const ratingLabels: Record<string, string> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong No",
}

const ratingColors: Record<string, string> = {
  STRONG_YES: "bg-green-100 text-green-700",
  YES: "bg-green-50 text-green-600",
  NO: "bg-red-50 text-red-600",
  STRONG_NO: "bg-red-100 text-red-700",
}

export function ActivityWidget({ activity }: Props) {
  return (
    <section className="flex flex-col gap-block">
      <h2 className="font-medium text-heading">Recent Activity</h2>
      {activity.length === 0 ? (
        <p className="py-section text-center text-caption text-muted-foreground">
          No comments or feedback yet
        </p>
      ) : (
        <div className="flex flex-col">
          {activity.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/productions/${item.productionId}?submission=${item.submissionId}`}
              className="flex items-start gap-element border-b py-element transition-colors last:border-b-0 hover:bg-muted/50"
            >
              {item.type === "comment" ? (
                <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <StarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-tight">
                <div className="flex items-baseline justify-between gap-element">
                  <span className="truncate font-medium text-label text-foreground">
                    {item.authorName}
                  </span>
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {day(item.createdAt).fromNow()}
                  </span>
                </div>
                {item.type === "comment" ? (
                  <p className="line-clamp-2 text-caption text-muted-foreground">
                    {item.content}
                  </p>
                ) : (
                  <div className="flex items-center gap-element">
                    <Badge className={ratingColors[item.rating]}>
                      {ratingLabels[item.rating]}
                    </Badge>
                    {item.notes && (
                      <span className="truncate text-caption text-muted-foreground">
                        {item.notes}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-caption text-muted-foreground">
                  {item.productionName}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: No errors.

---

### Task 7: Replace Home Page

**Files:**
- Modify: `src/app/(app)/home/page.tsx`

This replaces the entire file content. The page fetches all three data sources in parallel and renders either the empty state or the widget layout.

- [ ] **Step 1: Replace the page**

```tsx
// src/app/(app)/home/page.tsx
import { ClapperboardIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import { getDashboardProductions } from "@/actions/dashboard/get-dashboard-productions"
import { getRecentActivity } from "@/actions/dashboard/get-recent-activity"
import { getRecentEmails } from "@/actions/dashboard/get-recent-emails"
import { Button } from "@/components/common/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { ActivityWidget } from "@/components/home/activity-widget"
import { EmailsWidget } from "@/components/home/emails-widget"
import { ProductionsWidget } from "@/components/home/productions-widget"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Home — Castparty",
}

export default async function HomePage() {
  const [user, productions, emails, activity] = await Promise.all([
    getCurrentUser(),
    getDashboardProductions(),
    getRecentEmails(),
    getRecentActivity(),
  ])

  const hasProductions = productions.length > 0

  return (
    <Page>
      <PageHeader
        title={`Welcome, ${user?.firstName}.`}
        actions={
          hasProductions ? (
            <Button href="/productions/new" leftSection={<PlusIcon />}>
              Create production
            </Button>
          ) : undefined
        }
      />
      <PageContent>
        {!hasProductions ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClapperboardIcon />
                </EmptyMedia>
                <EmptyTitle>No productions yet</EmptyTitle>
                <EmptyDescription>
                  Create your first production to start managing auditions,
                  tracking submissions, and casting roles.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button href="/productions/new">Create production</Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="flex flex-col gap-section">
            <ProductionsWidget productions={productions} />
            <div className="grid gap-section sm:grid-cols-2">
              <EmailsWidget emails={emails} />
              <ActivityWidget activity={activity} />
            </div>
          </div>
        )}
      </PageContent>
    </Page>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | head -30`
Expected: Clean build, no errors.

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: No lint errors.

---

## Verification

After all tasks are complete:

1. **Build check**: `bun run build` should complete without errors
2. **Lint check**: `bun run lint` should pass
3. **Manual check**: Visit `/home` in the browser and verify:
   - With productions: Dashboard shows production cards with colored stage badges, recent emails, and recent activity
   - Without productions: Full-page empty state with "Create production" CTA
   - The "Create Production" button in the header links to `/productions/new`
   - Production cards link to `/productions/{id}`
   - Email items with submissions link to the submission detail
   - Activity items link to the submission detail
   - Relative timestamps display correctly (e.g., "2 hours ago")

## Agents

- **Tasks 1-3** (queries): Can be implemented by parallel subagents — they are independent files with no cross-dependencies
- **Tasks 4-6** (widgets): Can be implemented by parallel subagents — each widget is a standalone component that depends only on its corresponding query type
- **Task 7** (page): Must run after tasks 1-6 — it imports from all of them
