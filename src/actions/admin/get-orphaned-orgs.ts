"use server"

import { count, eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { Organization, Production, member } from "@/lib/db/schema"

export async function getOrganizations() {
  const memberCountSq = db
    .select({
      organizationId: member.organizationId,
      count: count().as("member_count"),
    })
    .from(member)
    .groupBy(member.organizationId)
    .as("mc")

  const productionCountSq = db
    .select({
      organizationId: Production.organizationId,
      count: count().as("production_count"),
    })
    .from(Production)
    .groupBy(Production.organizationId)
    .as("pc")

  return db
    .select({
      id: Organization.id,
      name: Organization.name,
      slug: Organization.slug,
      createdAt: Organization.createdAt,
      memberCount: memberCountSq.count,
      productionCount: productionCountSq.count,
    })
    .from(Organization)
    .leftJoin(memberCountSq, eq(memberCountSq.organizationId, Organization.id))
    .leftJoin(
      productionCountSq,
      eq(productionCountSq.organizationId, Organization.id),
    )
    .orderBy(Organization.createdAt)
}
