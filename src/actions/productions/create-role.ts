"use server"

import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage, Role } from "@/lib/db/schema"
import { buildStagesFromTemplate, buildSystemStages } from "@/lib/pipeline"
import { generateUniqueSlug } from "@/lib/slug"
import { generateId } from "@/lib/util"

export const createRole = secureActionClient
  .metadata({ action: "create-role" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      name: z.string().trim().min(1, "Role name is required.").max(100),
      description: z.string().trim().optional(),
    }),
  )
  .action(
    async ({
      parsedInput: { productionId, name, description },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Verify the production belongs to the user's organization
      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, formFields: true },
      })
      if (!production) throw new Error("Production not found.")

      const id = generateId("role")
      const slug = await generateUniqueSlug(
        name,
        Role,
        Role.slug,
        eq(Role.productionId, productionId),
      )

      await db.insert(Role).values({
        id,
        productionId,
        name,
        slug,
        description: description || "",
        formFields: production.formFields.map((f) => ({
          ...f,
          id: generateId("ff"),
        })),
      })

      // Try to copy stages from the production template
      const templateStages = await db.query.PipelineStage.findMany({
        where: (s) => and(eq(s.productionId, productionId), isNull(s.roleId)),
        columns: { name: true, order: true, type: true },
        orderBy: (s) => s.order,
      })

      const stages =
        templateStages.length > 0
          ? buildStagesFromTemplate(templateStages, id, productionId, orgId)
          : buildSystemStages(id, productionId, orgId)

      await db.insert(PipelineStage).values(stages)

      return { id }
    },
  )
