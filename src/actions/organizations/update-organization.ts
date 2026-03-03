"use server"

import { and, eq, not } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { OrganizationProfile, member, organization } from "@/lib/db/schema"
import { RESERVED_SLUGS } from "@/lib/slug"

export const updateOrganization = secureActionClient
  .metadata({ action: "update-organization" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      name: z.string().trim().min(1, "Organization name is required.").max(100),
      slug: z
        .string()
        .trim()
        .min(3, "URL ID must be at least 3 characters.")
        .max(60, "URL ID must be at most 60 characters.")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Lowercase letters, numbers, and hyphens only.",
        )
        .refine((s) => !/^\d+$/.test(s), "URL ID cannot be purely numeric.")
        .refine((s) => !RESERVED_SLUGS.has(s), "This URL ID is reserved.")
        .optional(),
      description: z.string().trim().max(500),
      websiteUrl: z.string().trim().url().or(z.literal("")),
      isOrganizationProfileOpen: z.boolean(),
    }),
  )
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

      await Promise.all([
        db
          .update(organization)
          .set({ name, ...(slug ? { slug } : {}) })
          .where(eq(organization.id, organizationId)),
        db
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
              updatedAt: new Date(),
            },
          }),
      ])

      return { success: true }
    },
  )
