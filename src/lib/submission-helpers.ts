import type { Feedback } from "@/lib/db/schema"
import type { CustomFormResponse } from "@/lib/types"

export type FeedbackData = Pick<
  typeof Feedback.$inferSelect,
  "id" | "rating" | "notes" | "formFields" | "answers" | "createdAt"
> & {
  submittedBy: { id: string; name: string; image: string | null }
  stage: { id: string; name: string }
}

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
