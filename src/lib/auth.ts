import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import {
  admin as adminPlugin,
  organization as organizationPlugin,
} from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { cache } from "react"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          if (session.activeOrganizationId) return { data: session }

          const memberships = await db
            .select({ orgId: member.organizationId })
            .from(member)
            .where(eq(member.userId, session.userId))
            .limit(1)

          return {
            data: {
              ...session,
              activeOrganizationId: memberships[0]?.orgId ?? null,
            },
          }
        },
      },
    },
  },
  plugins: [
    adminPlugin(),
    organizationPlugin({
      creatorRole: "owner",
    }),
    nextCookies(),
  ],
})

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  })
})

export const getCurrentUser = cache(async () => {
  const data = await getSession()
  return data?.user ?? null
})
