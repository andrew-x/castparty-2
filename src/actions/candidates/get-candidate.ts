"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Candidate } from "@/lib/db/schema"
import type { PipelineStageData } from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

export async function getCandidate(candidateId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const candidate = await db.query.Candidate.findFirst({
    where: eq(Candidate.id, candidateId),
    with: {
      submissions: {
        with: {
          role: {
            with: {
              pipelineStages: true,
            },
          },
          production: true,
          stage: true,
          files: {
            orderBy: (f, { asc }) => [asc(f.order)],
          },
        },
      },
    },
  })

  if (!candidate || candidate.organizationId !== orgId) return null

  const submissions = candidate.submissions.map((submission) => {
    const productionFormFields: CustomForm[] =
      (submission.production?.formFields as CustomForm[]) ?? []
    const roleFormFields: CustomForm[] =
      (submission.role?.formFields as CustomForm[]) ?? []
    const formFields = [...productionFormFields, ...roleFormFields]

    const pipelineStages: PipelineStageData[] = (
      submission.role?.pipelineStages ?? []
    )
      .map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        type: s.type as PipelineStageData["type"],
      }))
      .sort((a, b) => a.order - b.order)

    return {
      submission: {
        id: submission.id,
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: submission.email,
        phone: submission.phone,
        location: submission.location,
        createdAt: submission.createdAt,
        stageId: submission.stageId,
        stage: submission.stage
          ? {
              id: submission.stage.id,
              name: submission.stage.name,
              order: submission.stage.order,
              type: submission.stage.type as PipelineStageData["type"],
            }
          : null,
        answers: submission.answers ?? [],
        headshots: (submission.files ?? [])
          .filter((f) => f.type === "HEADSHOT")
          .map((f) => ({
            id: f.id,
            url: f.url,
            filename: f.filename,
            order: f.order,
          })),
        resume: (() => {
          const r = (submission.files ?? []).find((f) => f.type === "RESUME")
          return r ? { id: r.id, url: r.url, filename: r.filename } : null
        })(),
        resumeText: submission.resumeText ?? null,
        candidate: {
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
        },
      },
      pipelineStages,
      formFields,
      roleName: submission.role?.name ?? "Unknown",
      productionName: submission.production?.name ?? "Unknown",
    }
  })

  return {
    candidate: {
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      createdAt: candidate.createdAt,
    },
    submissions,
  }
}
