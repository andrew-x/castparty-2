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
import { sendEmail } from "@/lib/email"
import { InvitationEmail } from "@/lib/emails/invitation"
import { PasswordResetEmail } from "@/lib/emails/password-reset"
import { VerifyEmailEmail } from "@/lib/emails/verify-email"
import { getAppUrl } from "@/lib/url"

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`,
  user: {
    additionalFields: {
      firstName: { type: "string", required: true, input: true },
      lastName: { type: "string", required: true, input: true },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, token }) => {
      const resetUrl = getAppUrl(`/auth/reset-password?token=${token}`)
      // additionalFields are present at runtime but not in the callback type
      const firstName = (user as typeof user & { firstName: string }).firstName
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        react: PasswordResetEmail({ name: firstName, resetUrl }),
        text: `Reset your password here: ${resetUrl}`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      const verifyUrl = getAppUrl(`/auth/verify-email?token=${token}`)
      const firstName = (user as typeof user & { firstName: string }).firstName
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmailEmail({ name: firstName, verifyUrl }),
        text: `Verify your email here: ${verifyUrl}`,
      })
    },
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
      sendInvitationEmail: async (data) => {
        const acceptUrl = getAppUrl(`/accept-invitation/${data.id}`)
        await sendEmail({
          to: data.email,
          subject: `You're invited to ${data.organization.name}`,
          react: InvitationEmail({
            // name is always "${firstName} ${lastName}" — see additionalFields config
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
            acceptUrl,
          }),
          text: `${data.inviter.user.name} invited you to ${data.organization.name}. Accept here: ${acceptUrl}`,
        })
      },
    }),
    nextCookies(),
  ],
})

export type Auth = typeof auth

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  })
})

export const getCurrentUser = cache(async () => {
  const data = await getSession()
  return data?.user ?? null
})
