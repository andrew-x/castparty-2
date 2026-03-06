import type { CustomFormResponse } from "@/lib/types"

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

export interface SubmissionWithCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: Date | string
  stageId: string
  stage: PipelineStageData | null
  answers: CustomFormResponse[]
  headshots: HeadshotData[]
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
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
