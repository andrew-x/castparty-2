"use server"

import { and, asc, eq, ilike, not, or } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Candidate } from "@/lib/db/schema"

export async function searchCandidates(query: string, excludeId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const searchTerm = query.trim()
  if (!searchTerm) return []

  const pattern = `%${searchTerm}%`

  return db.query.Candidate.findMany({
    where: and(
      eq(Candidate.organizationId, orgId),
      not(eq(Candidate.id, excludeId)),
      or(
        ilike(Candidate.firstName, pattern),
        ilike(Candidate.lastName, pattern),
        ilike(Candidate.email, pattern),
      ),
    ),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: [asc(Candidate.lastName), asc(Candidate.firstName)],
    limit: 10,
  })
}
