"use server"

import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Candidate, Submission } from "@/lib/db/schema"

interface GetCandidatesParams {
  page?: number
  pageSize?: number
  search?: string
  productionIds?: string[]
  roleIds?: string[]
}

export async function getCandidates({
  page = 1,
  pageSize = 24,
  search,
  productionIds,
  roleIds,
}: GetCandidatesParams = {}) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return { candidates: [], totalCount: 0, page, pageSize }

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

  const hasProductionFilter = productionIds && productionIds.length > 0
  const hasRoleFilter = roleIds && roleIds.length > 0

  if (hasProductionFilter || hasRoleFilter) {
    const submissionConditions = []
    if (hasProductionFilter) {
      submissionConditions.push(inArray(Submission.productionId, productionIds))
    }
    if (hasRoleFilter) {
      submissionConditions.push(inArray(Submission.roleId, roleIds))
    }

    whereConditions.push(
      inArray(
        Candidate.id,
        db
          .selectDistinct({ id: Submission.candidateId })
          .from(Submission)
          .where(or(...submissionConditions)),
      ),
    )
  }

  const whereClause = and(...whereConditions)

  const [countResult, candidates] = await Promise.all([
    db.select({ count: count() }).from(Candidate).where(whereClause),
    db.query.Candidate.findMany({
      where: whereClause,
      orderBy: [asc(Candidate.lastName), asc(Candidate.firstName)],
      limit: pageSize,
      offset,
      with: {
        submissions: {
          orderBy: (s, { desc: d }) => [d(s.createdAt)],
          with: {
            role: { columns: { id: true, name: true } },
            production: { columns: { id: true, name: true } },
            stage: {
              columns: { id: true, name: true, type: true, order: true },
            },
            files: {
              columns: { url: true, type: true, order: true },
              orderBy: (f, { asc: a }) => [a(f.order)],
            },
          },
        },
      },
    }),
  ])

  return {
    candidates: candidates.map((c) => {
      const headshotUrl =
        c.submissions.flatMap((s) => s.files).find((f) => f.type === "HEADSHOT")
          ?.url ?? null

      return {
        ...c,
        headshotUrl,
        submissions: c.submissions.map(({ files, ...sub }) => sub),
      }
    }),
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  }
}
