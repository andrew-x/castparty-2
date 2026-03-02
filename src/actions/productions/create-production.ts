"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage, Production, Role } from "@/lib/db/schema"
import { buildSystemStages } from "@/lib/pipeline"
import { generateUniqueSlug, nameToSlug } from "@/lib/slug"
import { generateId } from "@/lib/util"

const roleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

const createProductionSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  description: z.string().trim().optional(),
  roles: z.array(roleSchema).optional(),
})

export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(createProductionSchema)
  .action(
    async ({ parsedInput: { name, description, roles }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) {
        throw new Error("No active organization.")
      }

      const productionId = generateId("prod")
      const productionSlug = await generateUniqueSlug(
        name,
        Production,
        Production.slug,
        eq(Production.organizationId, orgId),
      )

      await db.insert(Production).values({
        id: productionId,
        organizationId: orgId,
        name,
        slug: productionSlug,
        description: description || "",
      })

      if (roles?.length) {
        // New production has no existing roles, so generate slugs in memory
        const usedSlugs = new Set<string>()
        const roleValues = roles.map((role) => {
          let slug = nameToSlug(role.name)
          let counter = 2
          while (usedSlugs.has(slug)) {
            slug = `${nameToSlug(role.name)}-${counter}`
            counter++
          }
          usedSlugs.add(slug)
          return {
            id: generateId("role"),
            productionId,
            name: role.name,
            slug,
            description: role.description || "",
          }
        })

        await db.insert(Role).values(roleValues)

        // Create pipeline stages for each role
        const allStages = roleValues.flatMap((role) =>
          buildSystemStages(role.id, productionId, orgId),
        )
        await db.insert(PipelineStage).values(allStages)
      }

      return { id: productionId }
    },
  )
