import type { Metadata } from "next"
import { getUsers } from "@/actions/admin/get-users"
import { AdminUsersClient } from "@/components/admin/admin-users-client"

export const metadata: Metadata = {
  title: "Admin",
}

export default async function AdminPage() {
  const users = await getUsers()
  return <AdminUsersClient users={users} />
}
