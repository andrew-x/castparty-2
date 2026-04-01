"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage, Production, Role } from "@/lib/db/schema"
import {
  buildCustomProductionStages,
  buildProductionStages,
  DEFAULT_REJECT_REASONS,
} from "@/lib/pipeline"
import { createProductionActionSchema } from "@/lib/schemas/production"
import { generateUniqueSlug, nameToSlug, validateSlug } from "@/lib/slug"
import { generateId } from "@/lib/util"

export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(createProductionActionSchema)
  .action(
    async ({
      parsedInput: {
        name,
        description,
        location,
        roles,
        slug,
        customStages,
        submissionFormFields,
        feedbackFormFields,
      },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) {
        throw new Error("No active organization.")
      }

      const productionId = generateId("prod")

      // Resolve slug: use user-provided or auto-generate
      let productionSlug: string
      if (slug) {
        const validationError = validateSlug(slug)
        if (validationError) {
          throw new Error(validationError)
        }

        // Check uniqueness within the organization
        const existing = await db.query.Production.findFirst({
          where: (p) => and(eq(p.slug, slug), eq(p.organizationId, orgId)),
          columns: { slug: true },
        })

        if (existing) {
          throw new Error(
            "This URL ID is already taken. Choose a different one.",
          )
        }

        productionSlug = slug
      } else {
        productionSlug = await generateUniqueSlug(
          name,
          Production,
          Production.slug,
          eq(Production.organizationId, orgId),
        )
      }

      // Build production-level template stages
      // undefined = user skipped the stage step → seed defaults
      // [] = user intentionally removed all custom stages → system stages only
      const templateStages =
        customStages !== undefined
          ? buildCustomProductionStages(productionId, orgId, customStages)
          : buildProductionStages(productionId, orgId)

      await db.transaction(async (tx) => {
        await tx.insert(Production).values({
          id: productionId,
          organizationId: orgId,
          name,
          slug: productionSlug,
          description: description || "",
          location: location || "",
          banner: null,
          status: "open",
          submissionFormFields: submissionFormFields ?? [],
          feedbackFormFields: feedbackFormFields ?? [],
          rejectReasons: DEFAULT_REJECT_REASONS,
        })

        await tx.insert(PipelineStage).values(templateStages)

        if (roles?.length) {
          // New production has no existing roles, so generate slugs in memory
          const usedSlugs = new Set<string>()
          const roleValues = roles.map((role) => {
            let roleSlug = nameToSlug(role.name)
            let counter = 2
            while (usedSlugs.has(roleSlug)) {
              roleSlug = `${nameToSlug(role.name)}-${counter}`
              counter++
            }
            usedSlugs.add(roleSlug)
            return {
              id: generateId("role"),
              productionId,
              name: role.name,
              slug: roleSlug,
              description: role.description || "",
              status: "open" as const,
            }
          })

          await tx.insert(Role).values(roleValues)
        }
      })

      revalidatePath("/", "layout")
      return { id: productionId }
    },
  )
