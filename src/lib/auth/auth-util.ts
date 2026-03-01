import { eq } from "drizzle-orm"
import { getSession } from "@/lib/auth"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"
import { IS_MAINTENANCE_MODE } from "@/lib/util"

export async function checkAuth() {
  const data = await getSession()
  if (!data?.user || IS_MAINTENANCE_MODE) {
    throw new Error(
      "Unauthorized: You must be signed in to perform this action",
    )
  }

  let orgId = data.session.activeOrganizationId

  if (!orgId) {
    const memberships = await db
      .select({ orgId: member.organizationId })
      .from(member)
      .where(eq(member.userId, data.user.id))
      .limit(1)

    orgId = memberships[0]?.orgId ?? null
  }

  return {
    ...data.user,
    activeOrganizationId: orgId,
  }
}
