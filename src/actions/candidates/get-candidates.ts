"use server"

import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Candidate } from "@/lib/db/schema"

interface GetCandidatesParams {
  sort?: "name" | "email"
  dir?: "asc" | "desc"
  page?: number
  pageSize?: number
  search?: string
}

export async function getCandidates({
  sort = "name",
  dir = "asc",
  page = 1,
  pageSize = 25,
  search,
}: GetCandidatesParams = {}) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return { candidates: [], totalCount: 0, page, pageSize }

  const dirFn = dir === "desc" ? desc : asc

  const orderBy =
    sort === "email"
      ? [dirFn(Candidate.email)]
      : [dirFn(Candidate.lastName), dirFn(Candidate.firstName)]

  const offset = (page - 1) * pageSize

  const searchTerm = search?.trim()
  const whereConditions = [eq(Candidate.organizationId, orgId)]

  if (searchTerm) {
    const pattern = `%${searchTerm}%`
    const searchFilter = or(
      ilike(Candidate.firstName, pattern),
      ilike(Candidate.lastName, pattern),
      ilike(Candidate.email, pattern),
    )
    if (searchFilter) whereConditions.push(searchFilter)
  }

  const whereClause = and(...whereConditions)

  const [countResult, candidates] = await Promise.all([
    db.select({ count: count() }).from(Candidate).where(whereClause),
    db.query.Candidate.findMany({
      where: whereClause,
      orderBy,
      limit: pageSize,
      offset,
      with: {
        submissions: {
          with: {
            role: { columns: { id: true, name: true } },
            production: { columns: { id: true, name: true } },
            stage: {
              columns: { id: true, name: true, type: true, order: true },
            },
          },
        },
      },
    }),
  ])

  return {
    candidates,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  }
}
