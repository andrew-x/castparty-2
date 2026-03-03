"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { checkAuth } from "@/lib/auth/auth-util"

export interface UserInvitation {
  id: string
  organizationId: string
  organizationName: string
  role: string
  expiresAt: Date
}

export async function getUserInvitations(): Promise<UserInvitation[]> {
  const user = await checkAuth()

  const invitations = await auth.api.listUserInvitations({
    query: { email: user.email },
    headers: await headers(),
  })

  return invitations.map((inv) => ({
    id: inv.id,
    organizationId: inv.organizationId,
    organizationName: inv.organizationName,
    role: inv.role,
    expiresAt: inv.expiresAt,
  }))
}
