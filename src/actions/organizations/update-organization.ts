"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { member, OrganizationProfile, organization } from "@/lib/db/schema"
import { updateOrgActionSchema } from "@/lib/schemas/organization"

export const updateOrganization = secureActionClient
  .metadata({ action: "update-organization" })
  .inputSchema(updateOrgActionSchema)
  .action(
    async ({
      parsedInput: {
        organizationId,
        name,
        slug,
        description,
        websiteUrl,
        isOrganizationProfileOpen,
      },
      ctx: { user },
    }) => {
      const membership = await db
        .select({ role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, user.id),
          ),
        )
        .limit(1)

      if (!membership[0] || !["owner", "admin"].includes(membership[0].role)) {
        throw new Error(
          "You don't have permission to update this organization.",
        )
      }

      if (slug) {
        const conflict = await db.query.organization.findFirst({
          where: (o) => and(eq(o.slug, slug), not(eq(o.id, organizationId))),
          columns: { id: true },
        })
        if (conflict) {
          throw new Error("This URL ID is already taken.")
        }
      }

      await db.transaction(async (tx) => {
        await tx
          .update(organization)
          .set({ name, ...(slug ? { slug } : {}) })
          .where(eq(organization.id, organizationId))

        await tx
          .insert(OrganizationProfile)
          .values({
            id: organizationId,
            description,
            websiteUrl,
            isOrganizationProfileOpen,
          })
          .onConflictDoUpdate({
            target: OrganizationProfile.id,
            set: {
              description,
              websiteUrl,
              isOrganizationProfileOpen,
              updatedAt: day().toDate(),
            },
          })
      })

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
