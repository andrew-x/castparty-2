import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { organization as organizationPlugin } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { cache } from "react"
import db from "@/lib/db/db"
import { member, organization } from "@/lib/db/schema"

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await auth.api.createOrganization({
            body: {
              name: user.name,
              slug: `personal-${user.id}`,
              userId: user.id,
              metadata: { personal: true },
            },
          })
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (session.activeOrganizationId) return { data: session }

          const memberships = await db
            .select({ orgId: organization.id, metadata: organization.metadata })
            .from(member)
            .innerJoin(organization, eq(member.organizationId, organization.id))
            .where(eq(member.userId, session.userId))

          const personalOrg = memberships.find((m) => {
            const meta = m.metadata ? JSON.parse(m.metadata) : {}
            return meta.personal === true
          })

          return {
            data: {
              ...session,
              activeOrganizationId:
                personalOrg?.orgId ?? memberships[0]?.orgId ?? null,
            },
          }
        },
      },
    },
  },
  plugins: [
    organizationPlugin({
      creatorRole: "owner",
    }),
    nextCookies(),
  ],
})

export const getCurrentUser = cache(async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  })

  return data?.user ?? null
})
