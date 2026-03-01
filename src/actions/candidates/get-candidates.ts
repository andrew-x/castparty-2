"use server"

import { count, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Candidate, Submission } from "@/lib/db/schema"

export async function getCandidates() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db
    .select({
      id: Candidate.id,
      firstName: Candidate.firstName,
      lastName: Candidate.lastName,
      email: Candidate.email,
      phone: Candidate.phone,
      createdAt: Candidate.createdAt,
      submissionCount: count(Submission.id),
    })
    .from(Candidate)
    .leftJoin(Submission, eq(Submission.candidateId, Candidate.id))
    .where(eq(Candidate.organizationId, orgId))
    .groupBy(Candidate.id)
    .orderBy(Candidate.lastName, Candidate.firstName)
}
