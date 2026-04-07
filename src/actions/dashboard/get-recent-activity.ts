"use server"

import { desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import {
  Comment,
  Feedback,
  Production,
  Submission,
  User,
} from "@/lib/db/schema"

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

  // Fetch recent comments and feedback in parallel, scoped by org via Production join
  const [comments, feedbackRows] = await Promise.all([
    db
      .select({
        id: Comment.id,
        content: Comment.content,
        createdAt: Comment.createdAt,
        submissionId: Comment.submissionId,
        authorName: User.name,
        productionId: Submission.productionId,
        productionName: Production.name,
      })
      .from(Comment)
      .innerJoin(User, eq(Comment.submittedByUserId, User.id))
      .innerJoin(Submission, eq(Comment.submissionId, Submission.id))
      .innerJoin(Production, eq(Submission.productionId, Production.id))
      .where(eq(Production.organizationId, orgId))
      .orderBy(desc(Comment.createdAt))
      .limit(10),
    db
      .select({
        id: Feedback.id,
        rating: Feedback.rating,
        notes: Feedback.notes,
        createdAt: Feedback.createdAt,
        submissionId: Feedback.submissionId,
        authorName: User.name,
        productionId: Submission.productionId,
        productionName: Production.name,
      })
      .from(Feedback)
      .innerJoin(User, eq(Feedback.submittedByUserId, User.id))
      .innerJoin(Submission, eq(Feedback.submissionId, Submission.id))
      .innerJoin(Production, eq(Submission.productionId, Production.id))
      .where(eq(Production.organizationId, orgId))
      .orderBy(desc(Feedback.createdAt))
      .limit(10),
  ])

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
      productionName: c.productionName,
    })),
    ...feedbackRows.map((f) => ({
      type: "feedback" as const,
      id: f.id,
      authorName: f.authorName,
      rating: f.rating,
      notes: f.notes,
      createdAt: f.createdAt,
      submissionId: f.submissionId,
      productionId: f.productionId,
      productionName: f.productionName,
    })),
  ]

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return items.slice(0, 10)
}
