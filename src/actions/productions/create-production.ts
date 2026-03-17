"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage, Production, Role } from "@/lib/db/schema"
import {
  buildCustomProductionStages,
  buildProductionStages,
  buildStagesFromTemplate,
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
        const existing = await db
          .select({ slug: Production.slug })
          .from(Production)
          .where(
            and(
              eq(Production.slug, slug),
              eq(Production.organizationId, orgId),
            ),
          )
          .limit(1)

        if (existing.length > 0) {
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

      await db.insert(Production).values({
        id: productionId,
        organizationId: orgId,
        name,
        slug: productionSlug,
        description: description || "",
        location: location || "",
        isOpen: true,
        submissionFormFields: submissionFormFields ?? [],
        feedbackFormFields: feedbackFormFields ?? [],
        rejectReasons: DEFAULT_REJECT_REASONS,
      })

      // Build production-level template stages
      // undefined = user skipped the stage step → seed defaults
      // [] = user intentionally removed all custom stages → system stages only
      const templateStages =
        customStages !== undefined
          ? buildCustomProductionStages(productionId, orgId, customStages)
          : buildProductionStages(productionId, orgId)

      await db.insert(PipelineStage).values(templateStages)

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
            isOpen: true,
            submissionFormFields: (submissionFormFields ?? []).map((f) => ({
              ...f,
              id: generateId("ff"),
            })),
            feedbackFormFields: (feedbackFormFields ?? []).map((f) => ({
              ...f,
              id: generateId("fbf"),
            })),
            rejectReasons: DEFAULT_REJECT_REASONS,
          }
        })

        await db.insert(Role).values(roleValues)

        // Create pipeline stages for each role from the production template
        const allStages = roleValues.flatMap((role) =>
          buildStagesFromTemplate(templateStages, role.id, productionId, orgId),
        )
        await db.insert(PipelineStage).values(allStages)
      }

      revalidatePath("/", "layout")
      return { id: productionId }
    },
  )
