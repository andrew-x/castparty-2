import day from "@/lib/dayjs"
import type { Comment, Feedback } from "@/lib/db/schema"
import type { CustomFormResponse } from "@/lib/types"

export type FeedbackData = Pick<
  typeof Feedback.$inferSelect,
  "id" | "rating" | "notes" | "formFields" | "answers" | "createdAt"
> & {
  submittedBy: { id: string; name: string; image: string | null }
  stage: { id: string; name: string }
}

export type CommentData = Pick<
  typeof Comment.$inferSelect,
  "id" | "content" | "createdAt"
> & {
  submittedBy: { id: string; name: string; image: string | null }
}

export interface StageChangeData {
  id: string
  fromStageName: string | null
  toStageName: string | null
  changedBy: { name: string } | null
  createdAt: Date | string
}

export type ActivityItem =
  | { type: "feedback"; data: FeedbackData }
  | { type: "comment"; data: CommentData }
  | { type: "stage_change"; data: StageChangeData }
  | { type: "submitted"; data: { createdAt: Date | string } }

export interface PipelineStageData {
  id: string
  name: string
  order: number
  type: "APPLIED" | "SELECTED" | "REJECTED" | "CUSTOM"
}

export interface HeadshotData {
  id: string
  url: string
  filename: string
  order: number
}

export interface ResumeData {
  id: string
  url: string
  filename: string
}

export interface SubmissionWithCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  createdAt: Date | string
  stageId: string
  rejectionReason: string | null
  stage: PipelineStageData | null
  answers: CustomFormResponse[]
  links: string[]
  headshots: HeadshotData[]
  resume: ResumeData | null
  resumeText: string | null
  feedback: FeedbackData[]
  comments: CommentData[]
  stageChanges: StageChangeData[]
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

export interface OtherRoleSubmission {
  roleId: string
  roleName: string
}

export function getStageBadgeProps(stage: PipelineStageData | null): {
  variant: "secondary" | "destructive" | "outline"
  className?: string
} {
  if (!stage || stage.type === "APPLIED") return { variant: "secondary" }
  if (stage.type === "SELECTED")
    return {
      variant: "outline",
      className: "border-success-text/30 bg-success-light text-success-text",
    }
  if (stage.type === "REJECTED") return { variant: "destructive" }
  return { variant: "outline" }
}

export function getStageLabel(submission: SubmissionWithCandidate): string {
  return submission.stage?.name ?? "Inbound"
}

export function buildActivityList(
  submission: SubmissionWithCandidate,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...submission.feedback.map((fb) => ({
      type: "feedback" as const,
      data: fb,
    })),
    ...submission.comments.map((c) => ({
      type: "comment" as const,
      data: c,
    })),
    ...submission.stageChanges.map((sc) => ({
      type: "stage_change" as const,
      data: sc,
    })),
    { type: "submitted" as const, data: { createdAt: submission.createdAt } },
  ]
  return items.sort(
    (a, b) => day(b.data.createdAt).valueOf() - day(a.data.createdAt).valueOf(),
  )
}
