import type { Metadata } from "next"
import { getUsers } from "@/actions/admin/get-users"
import { AdminUsersClient } from "@/components/admin/admin-users-client"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin",
}

export default async function AdminPage() {
  const [users, sessionData] = await Promise.all([getUsers(), getSession()])
  return (
    <AdminUsersClient
      users={users}
      currentUserId={sessionData?.user?.id ?? null}
    />
  )
}
