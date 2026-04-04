"use server"

import { and, eq, inArray } from "drizzle-orm"
import db from "@/lib/db/db"
import { Candidate, Submission } from "@/lib/db/schema"

export async function checkSubmissionDuplicates({
  email,
  orgId,
  roleIds,
}: {
  email: string
  orgId: string
  roleIds: string[]
}) {
  if (roleIds.length === 0) return { duplicates: [] }

  const candidate = await db.query.Candidate.findFirst({
    where: and(
      eq(Candidate.organizationId, orgId),
      eq(Candidate.email, email.trim()),
    ),
    columns: { id: true },
  })

  if (!candidate) return { duplicates: [] }

  const existing = await db.query.Submission.findMany({
    where: and(
      eq(Submission.candidateId, candidate.id),
      inArray(Submission.roleId, roleIds),
    ),
    columns: { id: true, roleId: true },
    with: {
      role: { columns: { name: true } },
    },
  })

  return {
    duplicates: existing.map((s) => ({
      roleId: s.roleId,
      roleName: s.role.name,
      submissionId: s.id,
    })),
  }
}
