"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { member, OrganizationProfile } from "@/lib/db/schema"

export const updateOrganizationProfile = secureActionClient
  .metadata({ action: "update-organization-profile" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      websiteUrl: z.string().trim().url().or(z.literal("")),
      description: z.string().trim().max(500),
      isOrganizationProfileOpen: z.boolean(),
    }),
  )
  .action(
    async ({
      parsedInput: {
        organizationId,
        websiteUrl,
        description,
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

      await db
        .insert(OrganizationProfile)
        .values({
          id: organizationId,
          websiteUrl,
          description,
          isOrganizationProfileOpen,
        })
        .onConflictDoUpdate({
          target: OrganizationProfile.id,
          set: {
            websiteUrl,
            description,
            isOrganizationProfileOpen,
            updatedAt: new Date(),
          },
        })

      return { success: true }
    },
  )
