"use server"

import { and, eq, lt, max } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

export const addPipelineStage = secureActionClient
  .metadata({ action: "add-pipeline-stage" })
  .inputSchema(
    z.object({
      roleId: z.string().min(1),
      name: z.string().trim().min(1, "Stage name is required.").max(50),
    }),
  )
  .action(async ({ parsedInput: { roleId, name }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Verify ownership chain: role → production → org
    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      columns: { id: true },
      with: {
        production: { columns: { organizationId: true } },
      },
    })

    if (!role || role.production.organizationId !== orgId) {
      throw new Error("Role not found.")
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    if (!slug) {
      throw new Error("Stage name must contain at least one letter or number.")
    }

    // Check slug uniqueness within role
    const existingSlug = await db.query.PipelineStage.findFirst({
      where: (s) => and(eq(s.roleId, roleId), eq(s.slug, slug)),
      columns: { id: true },
    })

    if (existingSlug) {
      throw new Error("A stage with that name already exists for this role.")
    }

    // Calculate position: max position of non-terminal stages + 1
    const [result] = await db
      .select({ maxPos: max(PipelineStage.position) })
      .from(PipelineStage)
      .where(
        and(eq(PipelineStage.roleId, roleId), lt(PipelineStage.position, 1000)),
      )

    const position = (result?.maxPos ?? 0) + 1

    const id = generateId("stg")
    await db.insert(PipelineStage).values({
      id,
      roleId,
      name,
      slug,
      position,
      isSystem: false,
      isTerminal: false,
    })

    return { id }
  })
