"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import type {
  HeadshotData,
  ResumeData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"

export async function getRoleWithSubmissions(roleId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const role = await db.query.Role.findFirst({
    where: (r) => eq(r.id, roleId),
    with: {
      production: {
        columns: { id: true, organizationId: true },
      },
      pipelineStages: {
        orderBy: (s, { asc }) => [asc(s.order)],
      },
      submissions: {
        with: {
          candidate: true,
          stage: true,
          files: {
            orderBy: (f, { asc }) => [asc(f.order)],
          },
        },
      },
    },
  })

  if (!role || role.production.organizationId !== orgId) return null

  const submissions: SubmissionWithCandidate[] = role.submissions.map((sub) => {
    const allFiles = sub.files
    const headshots: HeadshotData[] = allFiles
      .filter((f) => f.type === "HEADSHOT")
      .map((f) => ({
        id: f.id,
        url: f.url,
        filename: f.filename,
        order: f.order,
      }))
    const resumeFile = allFiles.find((f) => f.type === "RESUME")
    const resume: ResumeData | null = resumeFile
      ? {
          id: resumeFile.id,
          url: resumeFile.url,
          filename: resumeFile.filename,
        }
      : null

    return {
      id: sub.id,
      firstName: sub.firstName,
      lastName: sub.lastName,
      email: sub.email,
      phone: sub.phone,
      location: sub.location,
      createdAt: sub.createdAt,
      stageId: sub.stageId,
      stage: sub.stage,
      answers: sub.answers,
      headshots,
      resume,
      resumeText: sub.resumeText,
      candidate: sub.candidate,
    }
  })

  return { ...role, submissions }
}
