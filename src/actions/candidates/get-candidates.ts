"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Candidate } from "@/lib/db/schema"

export async function getCandidates() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db.query.Candidate.findMany({
    where: eq(Candidate.organizationId, orgId),
    orderBy: (c, { asc }) => [asc(c.lastName), asc(c.firstName)],
  })
}
